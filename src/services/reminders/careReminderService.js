import { supabase } from '../../../supabase';
import { resolveAccessibleSharedPetIds as defaultResolveAccessibleSharedPetIds } from '../health/healthRecordService';

export const createCareReminderService = ({
  currentUserId = null,
  ensureWritablePetByPetId = async () => true,
  ensureWritablePetByRecordId = async () => true,
  resolveAccessibleSharedPetIdsFn = defaultResolveAccessibleSharedPetIds,
} = {}) => {
  // Compatibility aliases keep the extracted service behavior identical while
  // making all former PetSyncApp globals explicit dependencies.
  const CURRENT_USER_OWNER_ID = currentUserId;
  const resolveAccessibleSharedPetIds = resolveAccessibleSharedPetIdsFn;

  const saveCareReminderToSupabase = async (reminder) => {
    const canWrite = await ensureWritablePetByPetId(reminder?.petId, 'save a reminder');
    if (!canWrite) {
      return false;
    }
  
    const userId = CURRENT_USER_OWNER_ID || null;
    const payload = {
      id: reminder.id,
      pet_id: reminder.petId,
      user_id: userId,
      title: reminder.title,
      reminder_date: reminder.date || null,
      reminder_time: reminder.time || '',
      completed: !!reminder.completed,
      source: reminder.source || 'manual',
      source_record_id: reminder.sourceRecordId || null,
    };
  
    const { error } = await supabase.from('care_reminders').insert([payload]);
  
    if (error) {
      console.log('Supabase care reminder save error:', error);
      return false;
    }
  
    console.log('Care reminder saved to Supabase');
    return true;
  };
  
  const updateCareReminderInSupabase = async (reminder) => {
    const canWrite = await ensureWritablePetByPetId(reminder?.petId, 'update a reminder');
    if (!canWrite) {
      return false;
    }
  
    const userId = CURRENT_USER_OWNER_ID || null;
    const payload = {
      pet_id: reminder.petId,
      user_id: userId,
      title: reminder.title,
      reminder_date: reminder.date || null,
      reminder_time: reminder.time || '',
      completed: !!reminder.completed,
      source: reminder.source || 'manual',
      source_record_id: reminder.sourceRecordId || null,
    };
  
    const { error } = await supabase
      .from('care_reminders')
      .update(payload)
      .eq('id', reminder.id);
  
    if (error) {
      console.log('Supabase care reminder update error:', error);
      return false;
    }
  
    console.log('Care reminder updated in Supabase');
    return true;
  };
  
  const upsertCareReminderInSupabase = async (reminder) => {
    const canWrite = await ensureWritablePetByPetId(reminder?.petId, 'save or update a reminder');
    if (!canWrite) {
      return false;
    }
  
    const userId = CURRENT_USER_OWNER_ID || null;
    const payload = {
      id: reminder.id,
      pet_id: reminder.petId,
      user_id: userId,
      title: reminder.title,
      reminder_date: reminder.date || null,
      reminder_time: reminder.time || '',
      completed: !!reminder.completed,
      source: reminder.source || 'manual',
      source_record_id: reminder.sourceRecordId || null,
    };
  
    const { error } = await supabase
      .from('care_reminders')
      .upsert([payload], { onConflict: 'id' });
  
    if (error) {
      console.log('Supabase care reminder upsert error:', error);
      return false;
    }
  
    console.log('Care reminder upserted in Supabase');
    return true;
  };
  
  const deleteCareReminderFromSupabase = async (reminderId) => {
    const canWrite = await ensureWritablePetByRecordId('care_reminders', reminderId, 'delete a reminder');
    if (!canWrite) {
      return false;
    }
  
    const { error } = await supabase
      .from('care_reminders')
      .delete()
      .eq('id', reminderId);
  
    if (error) {
      console.log('Supabase care reminder delete error:', error);
      return false;
    }
  
    console.log('Care reminder deleted from Supabase');
    return true;
  };
  
  const loadCareRemindersFromSupabase = async (currentUser = null, accessiblePetIds = []) => {
    const currentUserId = currentUser?.id || CURRENT_USER_OWNER_ID;
    if (!currentUserId) {
      return [];
    }
  
    const sharedPetIds = await resolveAccessibleSharedPetIds(currentUserId, accessiblePetIds);
    const ownedQuery = supabase
      .from('care_reminders')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });
  
    const sharedQuery = sharedPetIds.length > 0
      ? supabase
        .from('care_reminders')
        .select('*')
        .in('pet_id', sharedPetIds)
        .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null });
  
    const [ownedResult, sharedResult] = await Promise.all([ownedQuery, sharedQuery]);
  
    if (ownedResult.error) {
      console.log('Supabase care reminders load error:', ownedResult.error);
      return null;
    }
  
    if (sharedResult?.error) {
      console.log('Supabase shared care reminders load error:', sharedResult.error);
      return null;
    }
  
    const mergedRows = [...(ownedResult.data || []), ...(sharedResult?.data || [])]
      .filter((row, index, list) => list.findIndex((item) => item.id === row.id) === index);
  
    if (mergedRows.length === 0) {
      console.log('No Supabase care reminders found, using empty state');
      return [];
    }
  
    const mappedReminders = mergedRows.map((row) => ({
      id: row.id,
      petId: row.pet_id,
      title: row.title,
      date: row.reminder_date,
      time: row.reminder_time,
      completed: row.completed,
      source: row.source,
      sourceRecordId: row.source_record_id,
      icon: '',
    }));
  
    console.log('Loaded care reminders from Supabase');
    return mappedReminders;
  };

  return {
    saveCareReminderToSupabase,
    updateCareReminderInSupabase,
    upsertCareReminderInSupabase,
    deleteCareReminderFromSupabase,
    loadCareRemindersFromSupabase,
  };
};
