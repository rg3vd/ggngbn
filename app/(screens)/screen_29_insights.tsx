import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';

export default function Screen29Insights() {
  const [refreshToken, setRefreshToken] = useState(0);
  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const transactions = useTransactionsStore((state) => state.transactions);
  const dismissed = useSettingsStore((state) => state.dismissedInsightIds);
  const dismissInsight = useSettingsStore((state) => state.dismissInsight);

  const insights = useMemo(() => {
    const items = [] as { id: string; text: string }[];
    if (transactions.length < 5) {
      items.push({ id: 'insufficient', text: 'Insufficient data. Add at least 5 deposits for deeper analysis.' });
    }
    const weekly = transactions.filter((item) => Date.now() - new Date(item.date).getTime() < 7 * 86400000);
    const weeklyTotal = weekly.reduce((sum, item) => sum + item.amount, 0);
    if (weeklyTotal > 0) {
      items.push({ id: 'weekly', text: `You saved ${Math.round(weeklyTotal)} UAH this week. Push a little harder to keep the streak glowing.` });
    }
    if (goals.some((goal) => goal.dailyStreak >= 3)) {
      items.push({ id: 'streak', text: 'You are building a real habit. Protect your active streak.' });
    }
    if (transactions.length > 0) {
      const average = transactions.reduce((sum, item) => sum + item.amount, 0) / transactions.length;
      items.push({ id: 'average', text: `Your average deposit is ${Math.round(average)} UAH. Consider increasing it on strong weeks.` });
    }
    const laggingGoal = goals.sort((a, b) => (a.currentAmount / a.targetAmount) - (b.currentAmount / b.targetAmount))[0];
    if (laggingGoal) {
      items.push({ id: 'lagging', text: `${laggingGoal.name} is your slowest goal right now. A focused deposit there would rebalance progress.` });
    }
    if (goals.some((goal) => goal.recommendedDailyAmount)) {
      items.push({ id: 'plan', text: 'An active savings plan exists. Follow your recommended daily pace to hit the target on time.' });
    }
    return items.filter((item) => !dismissed.includes(item.id));
  }, [dismissed, goals, refreshToken, transactions]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>DATA INSIGHTS</Text>
      <NeonButton label="Refresh Analysis" onPress={() => setRefreshToken((value) => value + 1)} />
      {insights.map((insight) => (
        <CyberpunkCard key={insight.id} onPress={() => dismissInsight(insight.id)}>
          <Text style={styles.insight}>{insight.text}</Text>
          <Text style={styles.meta}>Tap to dismiss</Text>
        </CyberpunkCard>
      ))}
      {insights.length === 0 ? <Text style={styles.meta}>No active insights right now.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: baseColors.background }, content: { padding: 20, paddingTop: 72, gap: 16 }, title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 }, insight: { color: baseColors.textPrimary, fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 24, marginBottom: 8 }, meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body } });
