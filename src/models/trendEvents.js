export const createGetTrendEventsForPet = ({ CARE_ACTIVITY_TYPES, normalizeCareActivityType } = {}) => {
const getTrendEventsForPet = (activityLogs, petId) => {
  if (!petId || !Array.isArray(activityLogs)) return [];

  return activityLogs
    .filter((log) => {
      const logPetId = log?.petId ?? log?.pet_id;
      const createdAt = log?.created_at || log?.createdAt || log?.dateKey;
      const normalizedType = normalizeCareActivityType(log?.type || log?.action_type);
      return String(logPetId || '') === String(petId) && !!createdAt && CARE_ACTIVITY_TYPES.has(normalizedType);
    })
    .sort((a, b) => {
      const left = new Date(a?.created_at || a?.createdAt || a?.dateKey || 0).getTime();
      const right = new Date(b?.created_at || b?.createdAt || b?.dateKey || 0).getTime();
      return right - left;
    });
};
  return getTrendEventsForPet;
};
