import { resolveAccessibleSharedPetIds } from '../health/healthRecordService';

export const createMemoryService = ({
  supabase,
  CURRENT_USER_OWNER_ID,
  normalizeStorageFileName,
  ensureWritablePetByPetId,
} = {}) => {
const uploadMemoryMediaToStorage = async ({ uri, fileName, mimeType, petId, userId }) => {
  if (!uri) {
    return null;
  }

  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const safeName = normalizeStorageFileName(fileName);
    const folder = `memory-vault/${String(userId || CURRENT_USER_OWNER_ID || 'guest').trim() || 'guest'}/${String(petId || 'unknown').trim() || 'unknown'}`;
    const filePath = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from('memory-vault')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      console.log('Memory Vault storage upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('memory-vault')
      .getPublicUrl(filePath);

    return {
      filePath,
      fileUrl: publicUrlData?.publicUrl || '',
    };
  } catch (error) {
    console.log('Memory Vault storage upload error:', error);
    return null;
  }
};

const saveMemoryToSupabase = async (memory) => {
  try {
    const canWrite = await ensureWritablePetByPetId(memory?.petId, 'save a memory');
    if (!canWrite) {
      return null;
    }

    const mediaUri = memory.publicUrl || memory.fileUrl || memory.photoUri || '';
    let publicUrl = String(memory.publicUrl || memory.fileUrl || '').trim();
    let storagePath = String(memory.storagePath || memory.filePath || '').trim();
    let mediaType = String(memory.mediaType || memory.mimeType || '').trim();
    const title = String(memory.title || memory.caption || '').trim();
    const description = String(memory.description || memory.caption || '').trim();

    if (mediaUri && !publicUrl) {
      const uploaded = await uploadMemoryMediaToStorage({
        uri: mediaUri,
        fileName: memory.fileName || title || `memory-${Date.now()}`,
        mimeType: mediaType,
        petId: memory.petId,
        userId: memory.userId || CURRENT_USER_OWNER_ID || 'guest',
      });

      if (!uploaded) {
        return null;
      }

      publicUrl = uploaded.fileUrl;
      storagePath = uploaded.filePath;
      mediaType = mediaType || uploaded.mimeType || '';
    }

    const payload = {
      id: memory.id,
      pet_id: memory.petId || null,
      user_id: CURRENT_USER_OWNER_ID || null,
      caption: title || description || '',
      memory_type: memory.type || memory.memoryType || 'Memory',
      memory_date: memory.date || null,
      photo_url: publicUrl || null,
      file_path: storagePath || null,
      milestone: Boolean(memory.milestone),
    };

    const { error } = await supabase.from('memories').upsert([payload]);

    if (error) {
      console.log('Supabase memories save error:', error);
      return null;
    }

    console.log('Memory saved to Supabase');
    return {
      ...payload,
      photoUri: publicUrl || memory.photoUri || null,
      fileUrl: publicUrl || '',
      filePath: storagePath || '',
      storagePath: storagePath || '',
      publicUrl: publicUrl || '',
      mimeType: mediaType || '',
      size: memory.size ?? null,
      fileName: memory.fileName || '',
      caption: payload.caption,
      description: description || title || '',
      mediaType,
      title,
      createdAt: memory.createdAt || new Date().toISOString(),
      emoji: publicUrl ? null : (memory.milestone ? '??' : '???'),
    };
  } catch (error) {
    console.log('Supabase memories save error:', error);
    return null;
  }
};

const loadMemoriesFromSupabase = async (currentUser = null, accessiblePetIds = []) => {
  const currentUserId = currentUser?.id || CURRENT_USER_OWNER_ID;
  if (!currentUserId) {
    return [];
  }

  try {
    const sharedPetIds = await resolveAccessibleSharedPetIds(currentUserId, accessiblePetIds);

    const ownedQuery = supabase
      .from('memories')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    const sharedQuery = sharedPetIds.length > 0
      ? supabase
        .from('memories')
        .select('*')
        .in('pet_id', sharedPetIds)
        .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null });

    const [ownedResult, sharedResult] = await Promise.all([ownedQuery, sharedQuery]);

    if (ownedResult.error) {
      console.log('Supabase memories load error:', ownedResult.error);
      return null;
    }

    if (sharedResult?.error) {
      console.log('Supabase shared memories load error:', sharedResult.error);
      return null;
    }

    const mergedRows = [...(ownedResult.data || []), ...(sharedResult?.data || [])]
      .filter((row, index, list) => list.findIndex((item) => item.id === row.id) === index);

    if (mergedRows.length === 0) {
      console.log('No Supabase memories found');
      return [];
    }

    const mappedMemories = mergedRows.map((row) => ({
      id: row.id,
      petId: row.pet_id || '',
      caption: row.caption || '',
      type: row.memory_type || 'Memory',
      date: row.memory_date || '',
      photoUri: row.photo_url || '',
      filePath: row.file_path || '',
      milestone: Boolean(row.milestone),
      milestoneLabel: row.milestone_label || row.caption || '',
      fileUrl: row.photo_url || '',
      publicUrl: row.photo_url || '',
      storagePath: row.file_path || '',
      mediaType: row.photo_url ? 'image/jpeg' : '',
      mimeType: row.photo_url ? 'image/jpeg' : '',
      title: row.caption || '',
      userId: row.user_id || null,
      createdAt: row.created_at || '',
      emoji: row.photo_url ? null : (row.milestone ? '??' : '???'),
      syncStatus: 'synced',
      description: row.caption || '',
      isShared: String(row.user_id || '') !== String(currentUserId),
      isReadOnly: String(row.user_id || '') !== String(currentUserId),
    }));

    console.log('Loaded memories from Supabase');
    return mappedMemories;
  } catch (err) {
    console.log('Supabase memories load error:', err);
    return null;
  }
};

const deleteMemoryFromSupabase = async (memory) => {
  if (!memory?.id) {
    return;
  }

  try {
    const canWrite = await ensureWritablePetByPetId(memory?.petId, 'delete a memory');
    if (!canWrite) {
      return;
    }

    const storagePath = memory.storagePath || memory.filePath || '';

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('memory-vault')
        .remove([storagePath]);

      if (storageError) {
        console.log('Memory Vault storage delete error:', storageError);
      } else {
        console.log('Memory file deleted from Supabase Storage');
      }
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memory.id);

    if (error) {
      console.log('Supabase memories delete error:', error);
      return;
    }

    console.log('Memory deleted from Supabase');
  } catch (error) {
    console.log('Supabase memories delete error:', error);
  }
};


  return {
    uploadMemoryMediaToStorage,
    saveMemoryToSupabase,
    loadMemoriesFromSupabase,
    deleteMemoryFromSupabase,
  };
};
