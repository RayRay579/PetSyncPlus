export const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (date) => {
  if (!date) return '';

  let d = typeof date === 'string'
    ? new Date(date + 'T12:00:00')
    : date;

  if (Number.isNaN(d.getTime()) && typeof date === 'string') {
    const loose = new Date(date);
    if (!Number.isNaN(loose.getTime())) {
      d = loose;
    }
  }

  if (Number.isNaN(d.getTime()) && typeof date === 'string') {
    const mmddyyyy = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (mmddyyyy) {
      const month = Number(mmddyyyy[1]);
      const day = Number(mmddyyyy[2]);
      const year = Number(mmddyyyy[3]);
      d = new Date(year, month - 1, day);
    }
  }

  if (Number.isNaN(d.getTime())) {
    return typeof date === 'string' ? date : '';
  }

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
};

export const parseStoredDateKey = (value) => {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(`${text}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatTimeForReminder = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${period}`;
};

export const parseReminderTimeString = (value) => {
  const text = String(value || '').trim().toUpperCase();
  if (!text) return null;

  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3];

  if (
    !Number.isInteger(hours)
    || !Number.isInteger(minutes)
    || minutes < 0
    || minutes > 59
  ) {
    return null;
  }

  if (hours < 1 || hours > 12) {
    return null;
  }

  if (hours === 12) hours = 0;
  if (meridiem === 'PM') hours += 12;

  return new Date(2000, 0, 1, hours, minutes, 0, 0);
};

export const parseReminderTimeToDate = (value) => {
  const parsedDate = parseReminderTimeString(value);

  if (!parsedDate) {
    return new Date();
  }

  return parsedDate;
};

export const normalizeReminderTimeLabel = (value) => {
  const parsedDate = parseReminderTimeString(value);

  return parsedDate
    ? formatTimeForReminder(parsedDate)
    : '';
};
