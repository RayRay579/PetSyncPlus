import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const parseCareReminderTimeToMinutes = (value) => {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?(?:\s*([AaPp][Mm]))?$/);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] || '0', 10);
  const meridiem = (match[3] || '').toUpperCase();

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (meridiem === 'PM') hours += 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return (hours * 60) + minutes;
};

export const getCareReminderScheduledDate = (reminder) => {
  if (!reminder?.date) return null;

  const dateParts = String(reminder.date).split('-');
  if (dateParts.length !== 3) return null;

  const year = Number.parseInt(dateParts[0], 10);
  const month = Number.parseInt(dateParts[1], 10);
  const day = Number.parseInt(dateParts[2], 10);

  if (!year || !month || !day) return null;

  const parsedMinutes = parseCareReminderTimeToMinutes(reminder.time);
  if (parsedMinutes == null) return null;

  const hours = Math.floor(parsedMinutes / 60);
  const minutes = parsedMinutes % 60;

  const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    scheduledAt.getFullYear() !== year ||
    scheduledAt.getMonth() !== month - 1 ||
    scheduledAt.getDate() !== day
  ) {
    return null;
  }

  return scheduledAt;
};

export const sharedReminderAlertedIds = new Set();
export const sharedReminderSnoozeUntil = new Map();

export const setCareReminderAlerted = (reminderId) => {
  sharedReminderAlertedIds.add(reminderId);
  sharedReminderSnoozeUntil.delete(reminderId);
};

export const clearCareReminderAlerted = (reminderId) => {
  sharedReminderAlertedIds.delete(reminderId);
  sharedReminderSnoozeUntil.delete(reminderId);
};

const REMINDER_NOTIFICATION_IDS_STORAGE_KEY = '@petsync/native_notif_ids';

let reminderNotificationIdsCache = null;
let reminderNotificationIdsLoadPromise = null;

const getReminderNotificationIds = async () => {
  if (reminderNotificationIdsCache) {
    return reminderNotificationIdsCache;
  }

  if (!reminderNotificationIdsLoadPromise) {
    reminderNotificationIdsLoadPromise = AsyncStorage
      .getItem(REMINDER_NOTIFICATION_IDS_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return {};

        try {
          const parsed = JSON.parse(raw);

          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
          }

          return parsed;
        } catch (error) {
          console.log('Reminder notification ids parse error:', error);
          return {};
        }
      })
      .catch((error) => {
        console.log('Reminder notification ids load error:', error);
        return {};
      })
      .then((ids) => {
        reminderNotificationIdsCache = ids;
        return ids;
      })
      .finally(() => {
        reminderNotificationIdsLoadPromise = null;
      });
  }

  return reminderNotificationIdsLoadPromise;
};

const persistReminderNotificationIds = async (ids) => {
  reminderNotificationIdsCache = ids;

  try {
    await AsyncStorage.setItem(
      REMINDER_NOTIFICATION_IDS_STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch (error) {
    console.log('Reminder notification ids save error:', error);
  }
};

const getStoredReminderNotificationId = async (reminderId) => {
  if (!reminderId) return null;

  const ids = await getReminderNotificationIds();
  return ids?.[reminderId] || null;
};

const setStoredReminderNotificationId = async (reminderId, notificationId) => {
  if (!reminderId || !notificationId) return;

  const ids = await getReminderNotificationIds();

  await persistReminderNotificationIds({
    ...ids,
    [reminderId]: notificationId,
  });
};

const clearStoredReminderNotificationId = async (reminderId) => {
  if (!reminderId) return;

  const ids = await getReminderNotificationIds();
  if (!ids?.[reminderId]) return;

  const nextIds = { ...ids };
  delete nextIds[reminderId];

  await persistReminderNotificationIds(nextIds);
};

export const cancelReminderNotification = async (reminderId) => {
  if (!reminderId) return null;

  try {
    const notificationId = await getStoredReminderNotificationId(reminderId);

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    await clearStoredReminderNotificationId(reminderId);

    return notificationId || null;
  } catch (error) {
    console.log('Cancel reminder notification error:', error);
    return null;
  }
};

export const scheduleReminderNotification = async (reminder) => {
  try {
    if (!reminder?.id) return null;

    const scheduledAt = getCareReminderScheduledDate(reminder);

    await cancelReminderNotification(reminder.id);

    if (!scheduledAt) return null;
    if (scheduledAt.getTime() <= Date.now()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'PetSync+ Reminder',
        body: reminder.title,
        sound: 'default',
        data: {
          reminderId: reminder.id,
          petId: reminder.petId || null,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledAt,
      },
    });

    await setStoredReminderNotificationId(reminder.id, notificationId);

    return notificationId;
  } catch (error) {
    console.log('Schedule reminder notification error:', error);
    return null;
  }
};
