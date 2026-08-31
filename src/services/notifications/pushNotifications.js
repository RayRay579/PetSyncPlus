import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../../supabase';

const getExpoProjectId = () => Constants?.expoConfig?.extra?.eas?.projectId
  ?? Constants?.easConfig?.projectId
  ?? '';

const savePushTokenToSupabase = async (expoPushToken, deviceName, userId = null) => {
  if (!expoPushToken) {
    return;
  }

  const { data: existingTokens, error: lookupError } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('expo_push_token', expoPushToken)
    .limit(1);

  if (lookupError) {
    console.log('Push token save error:', lookupError);
    return;
  }

  if ((existingTokens || []).length > 0) {
    return;
  }

  const { error } = await supabase.from('push_tokens').insert([
    {
      user_id: userId || null,
      expo_push_token: expoPushToken,
      device_name: deviceName || 'Unknown device',
    },
  ]);

  if (error) {
    console.log('Supabase push token save error:', error);
    return;
  }

  console.log('Push token saved to Supabase');
};

const loadPushTokensFromSupabase = async () => {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token, device_name')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase push tokens load error:', error);
    return [];
  }

  const uniqueTokens = new Map();

  (data || []).forEach((row) => {
    const token = String(row.expo_push_token || '').trim();
    if (!token || uniqueTokens.has(token)) {
      return;
    }

    uniqueTokens.set(token, {
      expoPushToken: token,
      deviceName: row.device_name || 'Unknown device',
    });
  });

  return Array.from(uniqueTokens.values());
};

const sendExpoPushNotifications = async (messages = []) => {
  const batches = [];
  const batchSize = 100;

  for (let index = 0; index < messages.length; index += batchSize) {
    batches.push(messages.slice(index, index + batchSize));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(responseJson));
      }

      return responseJson;
    }),
  );

  return results;
};

const sendLostPetAlertPushNotifications = async (alert) => {
  try {
    const pushTokens = await loadPushTokensFromSupabase();

    if (pushTokens.length === 0) {
      console.log('No push tokens found for Lost Pet alert notifications');
      return;
    }

    const uniqueMessages = pushTokens.map(({ expoPushToken }) => ({
      to: expoPushToken,
      sound: 'default',
      title: 'Lost Pet Alert',
      body: `${alert.petName || 'A pet'} was last seen near ${alert.lastSeenLocation || 'an unknown location'}`,
      data: {
        type: 'lost_pet_alert',
        alertId: alert.id || null,
      },
    }));

    const results = await sendExpoPushNotifications(uniqueMessages);
    console.log('Lost Pet alert notifications sent', results);
  } catch (error) {
    console.log('Lost Pet push notification send error:', error);
  }
};

const registerForPushNotificationsAsync = async (userId = null) => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const projectId = getExpoProjectId();
    if (!projectId) {
      console.log('Push notifications require a development build with an Expo projectId.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    console.log('Expo push token:', token);

    const deviceName = Device.deviceName || Device.modelName || Device.manufacturer || 'Unknown device';
    await savePushTokenToSupabase(token, deviceName, userId);

    return token;
  } catch (error) {
    console.log('Push token registration failed:', error);
    return null;
  }
};

export {
  savePushTokenToSupabase,
  loadPushTokensFromSupabase,
  sendExpoPushNotifications,
  sendLostPetAlertPushNotifications,
  registerForPushNotificationsAsync,
};
