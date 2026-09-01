export const createGetStreakEventsForPet = ({ getTrendEventsForPet, normalizeCareActivityType } = {}) => {
const getStreakEventsForPet = (activityLogs, petId, allowedTypes = null) => {
  const trendEvents = getTrendEventsForPet(activityLogs, petId);
  if (!Array.isArray(trendEvents) || trendEvents.length === 0) return [];

  const allowedSet = Array.isArray(allowedTypes)
    ? new Set(allowedTypes.map((type) => normalizeCareActivityType(type)))
    : null;

  const byDay = new Map();
  trendEvents.forEach((event) => {
    const eventDate = new Date(event?.created_at || event?.createdAt || event?.dateKey || 0);
    if (Number.isNaN(eventDate.getTime())) return;

    const normalizedType = normalizeCareActivityType(event?.action_type || event?.type);
    if (allowedSet && !allowedSet.has(normalizedType)) return;

    const dayKey = eventDate.toDateString();
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, {
        ...event,
        action_type: normalizedType,
        type: normalizedType,
        created_at: event?.created_at || event?.createdAt || eventDate.toISOString(),
      });
    }
  });

  return [...byDay.values()].sort((a, b) => {
    const left = new Date(a?.created_at || a?.createdAt || a?.dateKey || 0).getTime();
    const right = new Date(b?.created_at || b?.createdAt || b?.dateKey || 0).getTime();
    return right - left;
  });
};
  return getStreakEventsForPet;
};
