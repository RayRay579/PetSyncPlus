import { supabase } from '../../../supabase';
import { normalizeHealthRecordFromSupabase } from './healthRecordModel';

const resolveAccessibleSharedPetIds = async (currentUserId, accessiblePetIds = []) => {
  const directPetIds = Array.isArray(accessiblePetIds)
    ? accessiblePetIds.map((petId) => String(petId || '').trim()).filter(Boolean)
    : [];

  if (directPetIds.length > 0 || !currentUserId) {
    return [...new Set(directPetIds)];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('family_members')
    .select('household_id')
    .eq('member_user_id', currentUserId)
    .eq('status', 'accepted')
    .is('removed_at', null);

  if (membershipError) {
    return [];
  }

  const householdIds = [...new Set((memberships || [])
    .map((row) => row.household_id)
    .filter(Boolean))];

  if (householdIds.length === 0) {
    return [];
  }

  const { data: sharedPetsRows, error: sharedPetsError } = await supabase
    .from('pets')
    .select('id')
    .in('household_id', householdIds);

  if (sharedPetsError) {
    return [];
  }

  return [...new Set((sharedPetsRows || [])
    .map((row) => String(row.id || '').trim())
    .filter(Boolean))];
};

const saveHealthRecordToSupabase = async (record, { currentUserId = null, ensureWritablePetByPetId = async () => true } = {}) => {
  const canWrite = await ensureWritablePetByPetId(record?.petId, 'save a health record');
  if (!canWrite) {
    return false;
  }

  const userId = currentUserId || null;
  const payload = {
    id: record.id,
    pet_id: record.petId,
    user_id: userId,
    type: record.type,
    title: record.title,
    record_date: record.date || null,
    next_due: record.nextDue || null,
    details: record.details || {},
    notes: record.notes || '',
  };

  const { error } = await supabase.from('health_records').insert([payload]);

  if (error) {
    console.log('Supabase health record save error:', error);
    return false;
  }

  console.log('Health record saved to Supabase');
  return true;
};

const updateHealthRecordInSupabase = async (record, { currentUserId = null, ensureWritablePetByPetId = async () => true } = {}) => {
  const canWrite = await ensureWritablePetByPetId(record?.petId, 'update a health record');
  if (!canWrite) {
    return false;
  }

  const userId = currentUserId || null;
  const payload = {
    pet_id: record.petId,
    user_id: userId,
    type: record.type,
    title: record.title,
    record_date: record.date || null,
    next_due: record.nextDue || null,
    details: record.details || {},
    notes: record.notes || '',
  };

  const { error } = await supabase
    .from('health_records')
    .update(payload)
    .eq('id', record.id);

  if (error) {
    console.log('Supabase health record update error:', error);
    return false;
  }

  console.log('Health record updated in Supabase');
  return true;
};

const deleteHealthRecordFromSupabase = async (recordId, { ensureWritablePetByRecordId = async () => true } = {}) => {
  const canWrite = await ensureWritablePetByRecordId('health_records', recordId, 'delete a health record');
  if (!canWrite) {
    return false;
  }

  const { error } = await supabase
    .from('health_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    console.log('Supabase health record delete error:', error);
    return false;
  }

  console.log('Health record deleted from Supabase');
  return true;
};

const loadHealthRecordsFromSupabase = async (currentUser = null, accessiblePetIds = [], currentUserIdFallback = null) => {
  const currentUserId = currentUser?.id || currentUserIdFallback;
  if (!currentUserId) {
    return [];
  }

  const sharedPetIds = await resolveAccessibleSharedPetIds(currentUserId, accessiblePetIds);
  const ownedQuery = supabase
    .from('health_records')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  const sharedQuery = sharedPetIds.length > 0
    ? supabase
      .from('health_records')
      .select('*')
      .in('pet_id', sharedPetIds)
      .order('created_at', { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const [ownedResult, sharedResult] = await Promise.all([ownedQuery, sharedQuery]);

  if (ownedResult.error) {
    console.log('Supabase health records load error:', ownedResult.error);
    return null;
  }

  if (sharedResult?.error) {
    console.log('Supabase shared health records load error:', sharedResult.error);
    return null;
  }

  const mergedRows = [...(ownedResult.data || []), ...(sharedResult?.data || [])]
    .filter((row, index, list) => list.findIndex((item) => item.id === row.id) === index);

  if (mergedRows.length === 0) {
    console.log('No Supabase health records found, using empty state');
    return [];
  }

  const mappedRecords = mergedRows.map(normalizeHealthRecordFromSupabase);
  console.log('Loaded health records from Supabase');
  return mappedRecords;
};

export {
  resolveAccessibleSharedPetIds,
  saveHealthRecordToSupabase,
  updateHealthRecordInSupabase,
  deleteHealthRecordFromSupabase,
  loadHealthRecordsFromSupabase,
};
