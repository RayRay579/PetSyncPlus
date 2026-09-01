export const createFormatDiscoverBusinessHours = ({} = {}) => {
const formatDiscoverBusinessHours = (hoursJson) => {
  if (!hoursJson || typeof hoursJson !== 'object' || Array.isArray(hoursJson)) {
    return [];
  }

  const preferredDayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabelMap = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const entries = preferredDayOrder
    .map((day) => [day, hoursJson[day]])
    .filter(([, value]) => value != null && String(value).trim() !== '')
    .map(([day, value]) => {
      if (Array.isArray(value)) {
        return `${dayLabelMap[day] || day}: ${value.join(', ')}`;
      }

      if (typeof value === 'object') {
        const open = value.open || value.opens || value.start || value.from;
        const close = value.close || value.closes || value.end || value.to;
        if (open || close) {
          return `${dayLabelMap[day] || day}: ${[open, close].filter(Boolean).join(' - ')}`;
        }
      }

      return `${dayLabelMap[day] || day}: ${String(value).trim()}`;
    });

  if (entries.length > 0) return entries;

  return Object.entries(hoursJson)
    .filter(([, value]) => value != null && String(value).trim() !== '')
    .map(([key, value]) => `${String(key).replace(/[_-]+/g, ' ')}: ${Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value).trim()}`);
};
  return formatDiscoverBusinessHours;
};
