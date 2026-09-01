export const createGetStreakDaysFromEvents = ({} = {}) => {
const getStreakDaysFromEvents = (events) => {
  if (!Array.isArray(events) || events.length === 0) return 0;

  const uniqueDays = [...new Set(events.map((event) => {
    const eventDate = new Date(event?.created_at || event?.createdAt || event?.dateKey || 0);
    if (Number.isNaN(eventDate.getTime())) return null;
    return eventDate.toDateString();
  }).filter(Boolean))];

  let streakDays = 0;
  for (let i = 0; i < uniqueDays.length; i += 1) {
    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() - i);
    const expectedDay = expected.toDateString();
    if (uniqueDays.includes(expectedDay)) {
      streakDays += 1;
    } else {
      break;
    }
  }

  return streakDays;
};
  return getStreakDaysFromEvents;
};
