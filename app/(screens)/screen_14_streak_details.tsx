import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useStreakStore } from '@/store/streakStore';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy } from '@/utils';

export default function Screen14StreakDetails() {
  const params = useLocalSearchParams<{ goalId?: string }>();

  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const statsByGoalId = useStreakStore((state) => state.statsByGoalId);

  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const scoped = useMemo(() => {
    if (!params.goalId) {
      return goals;
    }
    const single = goals.find((g) => g.id === params.goalId);
    return single ? [single] : goals;
  }, [goals, params.goalId]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>STREAK DETAILS</Text>
      {scoped.map((goal) => {
        const stats = statsByGoalId[goal.id];
        return (
          <CyberpunkCard key={goal.id}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.metric}>Current: {stats?.current ?? goal.dailyStreak}</Text>
            <Text style={styles.metric}>Longest: {stats?.longest ?? goal.dailyStreak}</Text>
            <Text style={styles.metric}>Deposit Days: {stats?.totalDepositDays ?? 0}</Text>
            <Text style={styles.metric}>30-Day Pace: {formatCurrencyPrivacy(stats?.monthlyPace ?? 0, currency, privacyMode)}</Text>
          </CyberpunkCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 14 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  metric: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, marginBottom: 4 },
});