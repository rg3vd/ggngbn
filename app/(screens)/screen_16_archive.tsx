import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy, formatDisplayDate } from '@/utils';

export default function Screen16Archive() {
  const archivedGoals = useGoalsStore((state) => state.goals.filter((goal) => goal.archived));
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>ARCHIVE</Text>
      {archivedGoals.length === 0 ? <Text style={styles.empty}>No archived goals.</Text> : null}
      {archivedGoals.map((goal) => (
        <CyberpunkCard key={goal.id} borderColor={baseColors.border}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.meta}>
            {formatCurrencyPrivacy(goal.currentAmount, currency, privacyMode)} / {formatCurrencyPrivacy(goal.targetAmount, currency, privacyMode)}
          </Text>
          <Text style={styles.meta}>Created: {formatDisplayDate(goal.createdAt)}</Text>
          <Text style={styles.meta}>Archived: {goal.archivedAt ? formatDisplayDate(goal.archivedAt) : 'Unknown'}</Text>
        </CyberpunkCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 14 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, marginBottom: 4 },
  empty: { color: baseColors.textSecondary, fontFamily: fontFamilies.body },
});