export const createCommunityMediaStorageService = ({
  supabase,
  bucket,
  normalizeStorageFileName,
  currentUserId,
} = {}) => {
  const uploadCommunityPostMediaToStorage = async ({ uri, fileName, mimeType, mediaType, userId }) => {
    if (!uri) {
      return null;
    }

    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const safeName = normalizeStorageFileName(
        fileName || `community-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
      );
      const folder = `community-posts/${String(userId || currentUserId || 'guest').trim() || 'guest'}`;
      const filePath = `${folder}/${Date.now()}-${safeName}`;
      const resolvedMimeType = mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType: resolvedMimeType,
          upsert: true,
        });

      if (error) {
        console.log('Community media upload error:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        filePath,
        fileUrl: publicUrlData?.publicUrl || '',
        mimeType: resolvedMimeType,
      };
    } catch (error) {
      console.log('Community media upload error:', error);
      return null;
    }
  };

  const deleteCommunityPostMediaFromStorage = async (filePath) => {
    if (!filePath) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.log('Community media delete error:', error);
      }
    } catch (error) {
      console.log('Community media delete error:', error);
    }
  };

  return {
    uploadCommunityPostMediaToStorage,
    deleteCommunityPostMediaFromStorage,
  };
};
