export const createWeeklyTrendService = ({  } = {}) => {
const getWeeklyTrendSummaryForPet = (activityLogs, petId) => {
  const trendEvents = getTrendEventsForPet(activityLogs, petId);
  const today = new Date();
  const summary = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - offset));
    const key = date.toDateString();
    const count = trendEvents.filter((event) => {
      const eventDate = new Date(event?.created_at || event?.createdAt || event?.dateKey || 0);
      return !Number.isNaN(eventDate.getTime()) && eventDate.toDateString() === key;
    }).length;
    return {
      key,
      label: date.toLocaleDateString([], { weekday: 'short' }),
      count,
    };
  });

  return summary;
};
  return { getWeeklyTrendSummaryForPet };
};
