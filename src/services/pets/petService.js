import { supabase } from '../../../supabase';

export const createPetService = ({
  CURRENT_USER_OWNER_ID,
  CURRENT_USER_EMAIL,
  CURRENT_USER_NAME,
  getOrCreateOwnerHousehold,
  ensureWritablePetByPetId,
} = {}) => {
  const savePetToSupabase = async (pet) => {
    const weightMatch = String(pet.weight || '').match(/[\d.]+/);
    const parsedWeight = weightMatch ? Number(weightMatch[0]) : null;
    const normalizedWeight = Number.isFinite(parsedWeight) ? parsedWeight : null;
    const userId = CURRENT_USER_OWNER_ID || null;
    const ownerHousehold = await getOrCreateOwnerHousehold({
      id: userId,
      email: CURRENT_USER_EMAIL,
      user_metadata: { display_name: CURRENT_USER_NAME },
    });
  
    const { error } = await supabase.from('pets').insert([
      {
        id: pet.id,
        user_id: userId,
        household_id: ownerHousehold?.id || null,
        name: pet.name || '',
        species: pet.species || '',
        breed: pet.breed || '',
        birthday: pet.birthday && String(pet.birthday).trim() ? pet.birthday : null,
        weight: normalizedWeight,
        gender: pet.gender || '',
        photo_url: pet.photoUri || null,
        care_goals: pet.careGoals || '',
        health_score: pet.score ?? null,
      },
    ]);
  
    if (error) {
      console.log('Supabase pet save error:', error);
      return;
    }
  
    console.log('Pet saved to Supabase');
  };
  
  const loadPetsFromSupabase = async (currentUser = null) => {
    const currentUserId = currentUser?.id || CURRENT_USER_OWNER_ID;
    if (!currentUserId) {
      return [];
    }
  
    const [ownedResult, membershipResult] = await Promise.all([
      supabase
        .from('pets')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true }),
      supabase
        .from('family_members')
        .select('household_id')
        .eq('member_user_id', currentUserId)
        .eq('status', 'accepted')
        .is('removed_at', null),
    ]);
  
    if (ownedResult.error) {
      console.log('Supabase pets load error:', ownedResult.error);
      return [];
    }
  
    if (membershipResult.error) {
      console.log('Supabase family membership load error:', membershipResult.error);
      return [];
    }
  
    const ownedPets = ownedResult.data || [];
  
    const householdIds = [...new Set((membershipResult.data || [])
      .map((row) => row.household_id)
      .filter(Boolean))];
  
    let sharedPets = [];
    if (householdIds.length > 0) {
      const { data: sharedData, error: sharedError } = await supabase
        .from('pets')
        .select('*')
        .in('household_id', householdIds);
  
      if (sharedError) {
        console.log('Supabase shared pets load error:', sharedError);
        return [];
      }
  
      sharedPets = sharedData || [];
    }
  
    const mergedPets = [...ownedPets, ...sharedPets]
      .filter((row, index, list) => list.findIndex((item) => item.id === row.id) === index)
      .map((row) => ({
        ...row,
        isShared: String(row.user_id || row.owner_id || row.created_by_user_id || '') !== String(currentUserId || ''),
        isReadOnly: String(row.user_id || row.owner_id || row.created_by_user_id || '') !== String(currentUserId || ''),
      }));
  
    if (mergedPets.length === 0) {
      console.log('No Supabase pets found');
      return [];
    }
  
    const finalPets = mergedPets.map((pet) => {
      const isSharedPet = String(pet.user_id || '') !== String(currentUserId || '');
  
      return {
        ...pet,
        isShared: isSharedPet,
        isReadOnly: isSharedPet,
      };
    });
  
    console.log('Loaded pets from Supabase');
    return finalPets;
  };
  
  const deletePetFromSupabase = async (petId) => {
    if (!petId) {
      return false;
    }
  
    const canWrite = await ensureWritablePetByPetId(petId, 'delete pet');
    if (!canWrite) {
      return false;
    }
  
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId);
  
    if (error) {
      console.log('Supabase pet delete error:', error);
      return false;
    }
  
    console.log('Pet deleted from Supabase');
    return true;
  };

  return {
    savePetToSupabase,
    loadPetsFromSupabase,
    deletePetFromSupabase,
  };
};
