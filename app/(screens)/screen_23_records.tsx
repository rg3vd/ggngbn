import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateGoalProgress, formatCurrencyPrivacy } from '@/utils';

export default function Screen23Records() {
  const goals = useGoalsStore((state) => state.goals);
  const transactions = useTransactionsStore((state) => state.transactions);

  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const records = useMemo(() => {
    const largestDepositTransaction = transactions.reduce((max, item) => (item.amount > (max?.amount ?? 0) ? item : max), transactions[0]);
    const longestStreakGoal = goals.reduce((max, item) => (item.dailyStreak > (max?.dailyStreak ?? 0) ? item : max), goals[0]);
    const biggestGoal = goals.reduce((max, item) => (item.targetAmount > (max?.targetAmount ?? 0) ? item : max), goals[0]);
    const mostAdvancedGoal = goals.reduce(
      (max, item) => (calculateGoalProgress(item) > calculateGoalProgress(max) ? item : max),
      goals[0] ?? (null as unknown as typeof goals[number])
    );
    const averageDeposit = transactions.length > 0 ? transactions.reduce((sum, item) => sum + item.amount, 0) / transactions.length : 0;
    return { largestDepositTransaction, longestStreakGoal, biggestGoal, mostAdvancedGoal, averageDeposit };
  }, [goals, transactions]);

  const cards = [
    {
      key: 'largest',
      value: records.largestDepositTransaction ? formatCurrencyPrivacy(records.largestDepositTransaction.amount, currency, privacyMode) : '0',
      label: 'Largest deposit',
      detail: records.largestDepositTransaction?.comment || 'No deposits yet',
      color: baseColors.cyan,
    },
    {
      key: 'streak',
      value: `${records.longestStreakGoal?.dailyStreak ?? 0} days`,
      label: 'Longest streak',
      detail: records.longestStreakGoal?.name || 'No active goal',
      color: baseColors.green,
    },
    {
      key: 'target',
      value: records.biggestGoal ? formatCurrencyPrivacy(records.biggestGoal.targetAmount, currency, privacyMode) : '0',
      label: 'Biggest target',
      detail: records.biggestGoal?.name || 'No goals yet',
      color: baseColors.purple,
    },
    {
      key: 'advanced',
      value: `${Math.round(calculateGoalProgress(records.mostAdvancedGoal ?? ({ currentAmount: 0, targetAmount: 1 } as never)) * 100)}%`,
      label: 'Most advanced goal',
      detail: records.mostAdvancedGoal?.name || 'No goals yet',
      color: baseColors.warning,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>PERSONAL RECORDS</Text>
      <CyberpunkCard>
        <Text style={styles.summaryTitle}>Session average</Text>
        <Text style={styles.summaryValue}>{formatCurrencyPrivacy(records.averageDeposit, currency, privacyMode)}</Text>
        <Text style={styles.summaryMeta}>Average amount per deposit across the entire vault.</Text>
      </CyberpunkCard>
      <View style={styles.grid}>
        {cards.map((card) => (
          <CyberpunkCard key={card.key} borderColor={card.color}>
            <Text style={[styles.value, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.label}>{card.label}</Text>
            <Text style={styles.detail}>{card.detail}</Text>
          </CyberpunkCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  summaryTitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 8 },
  summaryValue: { color: baseColors.cyan, fontFamily: fontFamilies.headingBold, fontSize: 28, marginBottom: 6 },
  summaryMeta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  grid: { gap: 12 },
  value: { fontFamily: fontFamilies.headingBold, fontSize: 24, marginBottom: 8 },
  label: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, marginBottom: 6 },
  detail: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
});