import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text } from 'react-native';
import { VictoryBar, VictoryPie, VictoryTheme } from 'victory-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy } from '@/utils';

const chartWidth = Dimensions.get('window').width - 72;

export default function Screen26MoodLog() {
  const transactions = useTransactionsStore((state) => state.transactions);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const moodCounts = useMemo(() => {
    return transactions.reduce<Record<string, number>>((accumulator, transaction) => {
      const key = transaction.mood ?? 'none';
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [transactions]);

  const pieData = Object.entries(moodCounts).map(([mood, count]) => ({ x: mood.toUpperCase(), y: count }));
  const amountByMood = useMemo(() => {
    return transactions.reduce<Record<string, number>>((accumulator, transaction) => {
      const key = transaction.mood ?? 'none';
      accumulator[key] = (accumulator[key] ?? 0) + transaction.amount;
      return accumulator;
    }, {});
  }, [transactions]);
  const barData = Object.entries(amountByMood).map(([mood, amount]) => ({ x: mood.toUpperCase(), y: amount }));
  const topMood = Object.entries(amountByMood).sort((a, b) => b[1] - a[1])[0] ?? null;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>MOOD LOG</Text>
      {Object.keys(moodCounts).length === 0 ? <Text style={styles.empty}>No mood data yet.</Text> : null}
      {pieData.length > 0 ? (
        <CyberpunkCard>
          <Text style={styles.cardTitle}>Mood Distribution</Text>
          <VictoryPie
            width={chartWidth}
            height={260}
            data={pieData}
            theme={VictoryTheme.material}
            colorScale={[baseColors.cyan, baseColors.purple, baseColors.pink, baseColors.green, baseColors.warning]}
            style={{ labels: { fill: baseColors.textPrimary, fontSize: 11 } }}
          />
        </CyberpunkCard>
      ) : null}
      {barData.length > 0 ? (
        <CyberpunkCard>
          <Text style={styles.cardTitle}>Deposit volume by mood</Text>
          <VictoryBar
            width={chartWidth}
            height={240}
            data={barData}
            theme={VictoryTheme.material}
            style={{ data: { fill: baseColors.cyan }, labels: { fill: baseColors.textPrimary, fontSize: 11 } }}
          />
        </CyberpunkCard>
      ) : null}
      {topMood ? (
        <CyberpunkCard borderColor={baseColors.warning}>
          <Text style={styles.mood}>{topMood[0].toUpperCase()}</Text>
          <Text style={styles.meta}>Highest total deposit volume: {formatCurrencyPrivacy(topMood[1], currency, privacyMode)}</Text>
        </CyberpunkCard>
      ) : null}
      {Object.entries(moodCounts).map(([mood, count]) => (
        <CyberpunkCard key={mood}>
          <Text style={styles.mood}>{mood.toUpperCase()}</Text>
          <Text style={styles.meta}>{count} deposits</Text>
          <Text style={styles.meta}>Total value: {formatCurrencyPrivacy(amountByMood[mood] ?? 0, currency, privacyMode)}</Text>
        </CyberpunkCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  mood: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 6 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  empty: { color: baseColors.textSecondary, fontFamily: fontFamilies.body },
});