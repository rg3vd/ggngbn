import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { getNotificationDiagnostics, refreshSmartReminders, playAlertSound, playSuccessChimeSound, requestNotificationPermissions, scheduleGoalNotifications, sendTestNotification, triggerLightHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';

const weekdays = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export default function Screen15NotificationSettings() {
  const notifications = useSettingsStore((state) => state.notifications);
  const setNotifications = useSettingsStore((state) => state.setNotifications);
  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const [diagnostics, setDiagnostics] = useState('Checking notification permissions...');
  const hardcoreGoals = useMemo(() => goals.filter((goal) => goal.mode === 'hardcore'), [goals]);

  useEffect(() => {
    void getNotificationDiagnostics().then(setDiagnostics);
  }, []);

  const saveNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (!granted && notifications.enabled) {
      await playAlertSound();
      Alert.alert('Notifications disabled', 'Permission was not granted.');
      setNotifications({ ...notifications, enabled: false });
      setDiagnostics(await getNotificationDiagnostics());
      return;
    }

    try {
      const scheduled = await scheduleGoalNotifications(notifications, goals);
      await refreshSmartReminders(goals, useTransactionsStore.getState().transactions, useSettingsStore.getState());
      await Promise.all([triggerLightHaptic(), playSuccessChimeSound()]);
      setDiagnostics(await getNotificationDiagnostics());
      Alert.alert('Saved', `Notification settings updated. Scheduled ${scheduled} reminder(s).`);
    } catch {
      await playAlertSound();
      Alert.alert('Scheduling failed', 'Unable to schedule reminders on this device.');
      setNotifications({ ...notifications, enabled: false });
      setDiagnostics(await getNotificationDiagnostics());
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>NOTIFICATION SETTINGS</Text>
      <CyberpunkCard>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable notifications</Text>
          <Switch onValueChange={(value) => setNotifications({ ...notifications, enabled: value })} value={notifications.enabled} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Streak alert</Text>
          <Switch onValueChange={(value) => setNotifications({ ...notifications, streakAlertEnabled: value })} value={notifications.streakAlertEnabled} />
        </View>
        <Text style={styles.meta}>{diagnostics}</Text>
      </CyberpunkCard>
      <CyberpunkCard>
        <Text style={styles.label}>Notification Text</Text>
        <TextInput
          onChangeText={(value) => setNotifications({ ...notifications, text: value })}
          style={styles.input}
          value={notifications.text}
        />
        <Text style={styles.label}>Weekdays</Text>
        <View style={styles.rowWrap}>
          {weekdays.map((day) => (
            <NeonChip
              key={day.value}
              isSelected={notifications.selectedWeekdays.includes(day.value)}
              label={day.label}
              onPress={() => {
                const exists = notifications.selectedWeekdays.includes(day.value);
                setNotifications({
                  ...notifications,
                  selectedWeekdays: exists
                    ? notifications.selectedWeekdays.filter((item) => item !== day.value)
                    : [...notifications.selectedWeekdays, day.value],
                });
              }}
            />
          ))}
        </View>
      </CyberpunkCard>
      <CyberpunkCard borderColor={hardcoreGoals.length > 0 ? baseColors.warning : baseColors.border}>
        <Text style={styles.label}>Hardcore mode edge behavior</Text>
        {hardcoreGoals.length === 0 ? (
          <Text style={styles.meta}>No hardcore goals are active right now, so only the standard reminder schedule will be used.</Text>
        ) : (
          <>
            <Text style={styles.meta}>Hardcore goals detected: {hardcoreGoals.length}</Text>
            <Text style={styles.meta}>When streak alerts are enabled, an extra evening warning is scheduled for each hardcore goal to protect the daily streak.</Text>
          </>
        )}
      </CyberpunkCard>
      <NeonButton label="Save Notification Settings" onPress={() => void saveNotifications()} />
      <NeonButton label="Send Test Notification" onPress={() => void sendTestNotification(notifications.text)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  rowWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  switchLabel: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, fontSize: 15 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginTop: 6 },
});


