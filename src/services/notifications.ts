import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Goal, NotificationPreferences } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

const ensureAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#00f5ff',
    });
  } catch {
    // Ignore channel failures on unsupported environments.
  }
};

export const getNotificationDiagnostics = async (): Promise<string> => {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const status = permissions.granted ? 'granted' : permissions.canAskAgain ? 'prompt' : 'blocked';
    return `Permission: ${status} • Scheduled: ${scheduled.length}`;
  } catch {
    return 'Notification diagnostics unavailable on this device.';
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    await ensureAndroidChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) {
      return true;
    }

    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
};

export const scheduleGoalNotifications = async (preferences: NotificationPreferences, goals: Goal[] = []): Promise<number> => {
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!preferences.enabled || preferences.selectedWeekdays.length === 0) {
    return 0;
  }

  let scheduledCount = 0;

  await Promise.all(
    preferences.selectedWeekdays.map(async (weekday) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Скарбничка мрії',
          body: preferences.text,
          sound: false,
        },
        trigger: {
          channelId: 'default',
          hour: preferences.hour,
          minute: preferences.minute,
          repeats: true,
          weekday: weekday === 0 ? 1 : weekday + 1,
        },
      });
      scheduledCount += 1;
    })
  );

  const hardcoreGoals = goals.filter((goal) => !goal.archived && goal.mode === 'hardcore');
  if (preferences.streakAlertEnabled && hardcoreGoals.length > 0) {
    for (const goal of hardcoreGoals) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hardcore streak risk',
          body: `${goal.name}: deposit before midnight to protect your streak.`,
          sound: false,
        },
        trigger: {
          channelId: 'default',
          hour: Math.max(preferences.hour, 20),
          minute: preferences.minute,
          repeats: true,
        },
      });
      scheduledCount += 1;
    }
  }

  return scheduledCount;
};

export const sendTestNotification = async (text: string): Promise<void> => {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Mission Ping',
      body: text,
      sound: false,
    },
    trigger: null,
  });
};
