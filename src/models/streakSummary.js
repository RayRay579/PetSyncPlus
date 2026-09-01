export const createGetStreakSummaryForPet = ({ getStreakDaysFromEvents, getStreakEventsForPet } = {}) => {
const getStreakSummaryForPet = (activityLogs, petId) => {
  const careEvents = getStreakEventsForPet(activityLogs, petId);
  const medicationEvents = getStreakEventsForPet(activityLogs, petId, ['medication']);
  const walkEvents = getStreakEventsForPet(activityLogs, petId, ['walk']);
  const reminderEvents = getStreakEventsForPet(activityLogs, petId, ['reminder_completed']);

  return {
    care_streak: getStreakDaysFromEvents(careEvents),
    medication_streak: getStreakDaysFromEvents(medicationEvents),
    walk_streak: getStreakDaysFromEvents(walkEvents),
    reminder_completion_streak: getStreakDaysFromEvents(reminderEvents),
  };
};
  return getStreakSummaryForPet;
};
