export const createGetTrendActionBreakdownForPet = ({ getTrendEventsForPet, normalizeCareActivityType } = {}) => {
const getTrendActionBreakdownForPet = (activityLogs, petId) => {
  const breakdown = {
    meal: 0,
    walk: 0,
    medication: 0,
    weight: 0,
    grooming: 0,
    vet_visit: 0,
    reminder_completed: 0,
    custom: 0,
  };

  getTrendEventsForPet(activityLogs, petId).forEach((event) => {
    const normalizedType = normalizeCareActivityType(event?.action_type || event?.type);
    if (Object.prototype.hasOwnProperty.call(breakdown, normalizedType)) {
      breakdown[normalizedType] += 1;
    } else {
      breakdown.custom += 1;
    }
  });

  return breakdown;
};
  return getTrendActionBreakdownForPet;
};
