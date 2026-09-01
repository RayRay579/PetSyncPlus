export const createPetAccessService = ({
  supabase,
  currentUserId,
  getPetOwnerIdentity,
  showAlert,
} = {}) => {
  const isSharedPetForCurrentUser = (pet, currentUserIdOverride = currentUserId) => {
    const ownerIdentity = getPetOwnerIdentity(pet);
    const normalizedCurrentUserId = String(currentUserIdOverride || '').trim();

    if (!ownerIdentity || !normalizedCurrentUserId) {
      return false;
    }

    return ownerIdentity !== normalizedCurrentUserId;
  };

  const ensureWritablePetByPetId = async (petId, actionLabel = 'modify this pet data') => {
    const normalizedCurrentUserId = String(currentUserId || '').trim();
    if (!normalizedCurrentUserId || !petId) {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('user_id, owner_id, created_by_user_id')
        .eq('id', petId)
        .limit(1);

      if (error) {
        console.log(`Pet write access lookup error while trying to ${actionLabel}:`, error);
        return false;
      }

      const petRow = Array.isArray(data) ? data[0] : data;
      if (!petRow) {
        return true;
      }

      if (isSharedPetForCurrentUser(petRow, normalizedCurrentUserId)) {
        showAlert?.('Read-only pet', 'Family Shared pet: view-only access');
        return false;
      }

      return true;
    } catch (error) {
      console.log('Pet write access guard error:', error);
      return false;
    }
  };

  const ensureWritablePetByRecordId = async (tableName, recordId, actionLabel = 'modify this record') => {
    if (!recordId) {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('pet_id')
        .eq('id', recordId)
        .limit(1);

      if (error) {
        console.log(`${tableName} write access lookup error while trying to ${actionLabel}:`, error);
        return false;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.pet_id) {
        return true;
      }

      return await ensureWritablePetByPetId(row.pet_id, actionLabel);
    } catch (error) {
      console.log(`${tableName} write access guard error:`, error);
      return false;
    }
  };

  return {
    isSharedPetForCurrentUser,
    ensureWritablePetByPetId,
    ensureWritablePetByRecordId,
  };
};
