import * as Notifications from 'expo-notifications';

import { STORAGE_KEYS } from '@/constants';
import { Goal, SettingsState, Transaction } from '@/types';
import { readJson, storage, writeJson } from '@/store/storage';
import { toDateKey } from '@/utils';

export interface SmartReminderResult {
  scheduledIds: string[];
  reason: string;
}

const clampTimeToQuietHours = (hour: number, minute: number): { hour: number; minute: number } => {
  // Default quiet hours: 09:00–22:30
  const minMinutes = 9 * 60;
  const maxMinutes = 22 * 60 + 30;
  const requested = Math.max(0, Math.min(23, hour)) * 60 + Math.max(0, Math.min(59, minute));
  const clamped = Math.max(minMinutes, Math.min(maxMinutes, requested));
  return { hour: Math.floor(clamped / 60), minute: clamped % 60 };
};

const getLastDepositKey = (transactions: Transaction[]): string | null => {
  if (transactions.length === 0) {
    return null;
  }
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest ? toDateKey(latest.date) : null;
};

const daysSinceKey = (key: string): number => {
  const now = new Date();
  const start = new Date(key + 'T00:00:00');
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

const pickSmartText = (goals: Goal[], transactions: Transaction[], settings: SettingsState): { title: string; body: string; reason: string } => {
  const todayKey = toDateKey(new Date().toISOString());
  const lastDepositKey = getLastDepositKey(transactions);

  const hardcoreGoals = goals.filter((g) => !g.archived && g.mode === 'hardcore');
  const hardcoreRisk = hardcoreGoals.some((g) => (g.lastDepositDate ? toDateKey(g.lastDepositDate) : null) !== todayKey);

  if (hardcoreGoals.length > 0 && hardcoreRisk) {
    return {
      title: 'STREAK AT RISK',
      body: 'Hardcore контракт активний. Зроби депозит до опівночі, щоб уникнути System Failure.',
      reason: 'hardcore-risk',
    };
  }

  if (lastDepositKey) {
    const days = daysSinceKey(lastDepositKey);
    if (days >= 2) {
      return {
        title: 'SIGNAL LOSS',
        body: `Немає депозитів вже ${days} дні(в). Один маленький внесок поверне темп і streak.`,
        reason: 'no-deposits-2d',
      };
    }
  }

  return {
    title: 'Mission Ping',
    body: settings.notifications.text,
    reason: 'default',
  };
};

const cancelPreviousSmartReminders = async (): Promise<void> => {
  const ids = readJson<string[]>(STORAGE_KEYS.smartReminderIds, []);
  await Promise.all(
    ids.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // ignore
      }
    })
  );
  writeJson(STORAGE_KEYS.smartReminderIds, []);
};

export const refreshSmartReminders = async (goals: Goal[], transactions: Transaction[], settings: SettingsState): Promise<SmartReminderResult> => {
  await cancelPreviousSmartReminders();

  if (!settings.notifications.enabled) {
    return { scheduledIds: [], reason: 'notifications-disabled' };
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    return { scheduledIds: [], reason: 'permission-not-granted' };
  }

  const time = clampTimeToQuietHours(settings.notifications.hour, settings.notifications.minute);
  const message = pickSmartText(goals, transactions, settings);

  const ids: string[] = [];

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: false,
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });
    ids.push(id);
  } catch {
    // ignore
  }

  if (settings.notifications.streakAlertEnabled) {
    const hardcoreGoals = goals.filter((g) => !g.archived && g.mode === 'hardcore');
    if (hardcoreGoals.length > 0) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Hardcore streak check',
            body: 'Вечірній сигнал: якщо сьогодні не було депозиту, streak може зірватися.',
            sound: false,
          },
          trigger: {
            hour: Math.max(20, time.hour),
            minute: time.minute,
            repeats: true,
          },
        });
        ids.push(id);
      } catch {
        // ignore
      }
    }
  }

  writeJson(STORAGE_KEYS.smartReminderIds, ids);
  storage.set(STORAGE_KEYS.smartReminderIds + '_reason', message.reason);

  return { scheduledIds: ids, reason: message.reason };
};
