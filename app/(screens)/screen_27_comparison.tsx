import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { VictoryBar, VictoryChart, VictoryGroup, VictoryPolarAxis, VictoryTheme } from 'victory-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonChip from '@/components/NeonChip';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateGoalProgress, formatCurrencyPrivacy } from '@/utils';

export default function Screen27Comparison() {
  const [layout, setLayout] = useState<'side' | 'stack'>('side');
  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const setActiveGoalId = useSettingsStore((state) => state.setActiveGoalId);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const transactions = useTransactionsStore((state) => state.transactions);

  const compared = useMemo(() => {
    return goals.slice(0, 2).map((goal) => {
      const goalTransactions = transactions.filter((transaction) => transaction.goalId === goal.id);
      const average = goalTransactions.length === 0 ? 0 : goalTransactions.reduce((sum, item) => sum + item.amount, 0) / goalTransactions.length;
      return {
        goal,
        progress: Math.round(calculateGoalProgress(goal) * 100),
        average,
        txCount: goalTransactions.length,
      };
    });
  }, [goals, transactions]);

  const winner = compared.sort((a, b) => b.progress - a.progress)[0] ?? null;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>COMPARISON MODE</Text>
      <View style={styles.rowWrap}>
        <NeonChip label="Side by Side" isSelected={layout === 'side'} onPress={() => setLayout('side')} />
        <NeonChip label="Stacked" isSelected={layout === 'stack'} onPress={() => setLayout('stack')} />
      </View>
      <Text style={styles.delta}>{winner ? `Leading goal: ${winner.goal.name}` : 'Need two goals to compare.'}</Text>
      <View style={[styles.compareContainer, layout === 'stack' && styles.stackContainer]}>
        {compared.map((item) => (
          <CyberpunkCard key={item.goal.id} borderColor={item.goal.type === 'ps5' ? baseColors.cyan : baseColors.purple}>
            <Text style={styles.goalName}>{item.goal.name}</Text>
            <Text style={styles.meta}>Progress: {item.progress}%</Text>
            <Text style={styles.meta}>Saved: {formatCurrencyPrivacy(item.goal.currentAmount, currency, privacyMode)}</Text>
            <Text style={styles.meta}>Daily avg: {formatCurrencyPrivacy(item.average, currency, privacyMode)}</Text>
            <Text style={styles.meta}>Transactions: {item.txCount}</Text>
            <Text style={styles.meta}>Streak: {item.goal.dailyStreak} days</Text>
            <Text style={styles.switch} onPress={() => setActiveGoalId(item.goal.id)}>Set active</Text>
          </CyberpunkCard>
        ))}
      </View>
      {compared.length === 2 ? (
        <CyberpunkCard>
          <Text style={styles.cardTitle}>Progress Radar</Text>
          <VictoryChart polar theme={VictoryTheme.material} height={260}>
            <VictoryPolarAxis style={polarStyle} tickValues={['Progress', 'Average', 'Count']} />
            <VictoryGroup colorScale={[baseColors.cyan, baseColors.purple]}>
              {compared.map((item) => (
                <VictoryBar
                  key={item.goal.id}
                  data={[
                    { x: 'Progress', y: item.progress },
                    { x: 'Average', y: Math.min(item.average / 10, 100) },
                    { x: 'Count', y: Math.min(item.txCount * 10, 100) },
                  ]}
                />
              ))}
            </VictoryGroup>
          </VictoryChart>
        </CyberpunkCard>
      ) : null}
    </ScrollView>
  );
}

const polarStyle = { tickLabels: { fill: baseColors.textMuted, fontSize: 10 }, axis: { stroke: 'rgba(255,255,255,0.08)' }, grid: { stroke: 'rgba(255,255,255,0.06)' } };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  rowWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  delta: { color: baseColors.warning, fontFamily: fontFamilies.accentBold },
  compareContainer: { flexDirection: 'row', gap: 12 },
  stackContainer: { flexDirection: 'column' },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 6 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, marginBottom: 4 },
  switch: { color: baseColors.cyan, fontFamily: fontFamilies.accentBold, marginTop: 8 },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
});