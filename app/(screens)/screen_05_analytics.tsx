import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

import BottomNavBar from '@/components/BottomNavBar';
import CommsFloatingPing from '@/components/CommsFloatingPing';
import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { bottomNavRoutes } from '@/constants';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateForecastDate, formatCurrencyPrivacy, toDateKey } from '@/utils';

const chartWidth = Dimensions.get('window').width - 56;

export default function Screen05Analytics() {
  const [showBoth, setShowBoth] = useState(true);
  const proEnabled = useSettingsStore((state) => state.proEnabled);
  const setProEnabled = useSettingsStore((state) => state.setProEnabled);

  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const transactions = useTransactionsStore((state) => state.transactions);

  const lineData = useMemo(() => {
    return goals.slice(0, 2).map((goal) => {
      const series = transactions
        .filter((transaction) => transaction.goalId === goal.id)
        .sort((a, b) => a.date.localeCompare(b.date))
        .reduce<{ x: number; y: number }[]>((accumulator, transaction, index) => {
          const previous = accumulator[index - 1]?.y ?? 0;
          accumulator.push({ x: index + 1, y: previous + transaction.amount });
          return accumulator;
        }, []);

      return { goal, series: series.length > 0 ? series : [{ x: 1, y: 0 }] };
    });
  }, [goals, transactions]);

  const weekdayBars = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums = new Array(7).fill(0);
    transactions.forEach((transaction) => {
      sums[new Date(transaction.date).getDay()] += transaction.amount;
    });
    return labels.map((label, index) => ({ x: label, y: sums[index] }));
  }, [transactions]);

  const summary = useMemo(() => {
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const largestDeposit = transactions.reduce((largest, item) => Math.max(largest, item.amount), 0);
    const averageDeposit = transactions.length === 0 ? 0 : transactions.reduce((sum, item) => sum + item.amount, 0) / transactions.length;
    const focusedGoal = goals.find((goal) => goal.id === activeGoalId) ?? goals[0] ?? null;
    const forecast = focusedGoal ? calculateForecastDate(focusedGoal, transactions) : null;
    return { totalSaved, totalTarget, largestDeposit, averageDeposit, forecast };
  }, [activeGoalId, goals, transactions]);

  const proSignals = useMemo(() => {
    const byDay: Record<string, number> = {};
    transactions.forEach((t) => {
      const key = toDateKey(t.date);
      byDay[key] = (byDay[key] ?? 0) + t.amount;
    });
    const values = Object.values(byDay);
    const mean = values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.length === 0 ? 0 : values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const anomalies = Object.entries(byDay)
      .filter(([, v]) => std > 0 && (v > mean + 2 * std || v < Math.max(0, mean - 2 * std)))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([day, v]) => ({ day, value: v }));

    const depositDays = new Set(transactions.map((t) => toDateKey(t.date))).size;
    const volatility = mean > 0 ? std / mean : 0.8;
    const confidence = Math.max(0.1, Math.min(0.95, Math.min(1, depositDays / 14) * (1 - Math.min(0.6, volatility))));

    return { anomalies, confidence };
  }, [transactions]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ANALYTICS</Text>
        <View style={styles.toggleRow}>
          <NeonChip label="Show Both" isSelected={showBoth} onPress={() => setShowBoth(true)} />
          <NeonChip label="Active Only" isSelected={!showBoth} onPress={() => setShowBoth(false)} />
        </View>

        <CyberpunkCard>
          <Text style={styles.cardTitle}>Progress Flow</Text>
          <VictoryChart width={chartWidth} height={240} theme={VictoryTheme.material} domainPadding={12}>
            <VictoryAxis style={axisStyle} dependentAxis />
            <VictoryAxis style={axisStyle} />
            {lineData
              .filter((item, index) => showBoth || index === 0)
              .map((item) => (
                <VictoryLine
                  key={item.goal.id}
                  data={item.series}
                  interpolation="monotoneX"
                  style={{ data: { stroke: item.goal.type === 'ps5' ? baseColors.cyan : baseColors.purple, strokeWidth: 3 } }}
                />
              ))}
          </VictoryChart>
        </CyberpunkCard>

        <CyberpunkCard>
          <Text style={styles.cardTitle}>Deposit Rhythm</Text>
          <VictoryChart width={chartWidth} height={240} theme={VictoryTheme.material} domainPadding={18}>
            <VictoryAxis style={axisStyle} dependentAxis />
            <VictoryAxis style={axisStyle} />
            <VictoryBar data={weekdayBars} style={{ data: { fill: baseColors.pink, width: 20 } }} />
          </VictoryChart>
        </CyberpunkCard>

        <View style={styles.metricsGrid}>
          <CyberpunkCard>
            <Text style={styles.value}>{formatCurrencyPrivacy(summary.totalSaved, currency, privacyMode)}</Text>
            <Text style={styles.label}>Saved total</Text>
          </CyberpunkCard>
          <CyberpunkCard>
            <Text style={styles.value}>{formatCurrencyPrivacy(summary.totalTarget, currency, privacyMode)}</Text>
            <Text style={styles.label}>Target total</Text>
          </CyberpunkCard>
          <CyberpunkCard>
            <Text style={styles.value}>{formatCurrencyPrivacy(summary.largestDeposit, currency, privacyMode)}</Text>
            <Text style={styles.label}>Largest deposit</Text>
          </CyberpunkCard>
          <CyberpunkCard>
            <Text style={styles.value}>{formatCurrencyPrivacy(summary.averageDeposit, currency, privacyMode)}</Text>
            <Text style={styles.label}>Average deposit</Text>
          </CyberpunkCard>
        </View>

        <CyberpunkCard>
          <Text style={styles.cardTitle}>PRO ANALYTICS</Text>
          <View style={styles.toggleRow}>
            <NeonChip label="PRO TRIAL" isSelected={proEnabled} onPress={() => setProEnabled(!proEnabled)} />
            <NeonChip label="RISK SIMULATOR" isSelected={false} onPress={() => router.push('/(screens)/screen_31_risk_simulator')} />
          </View>
          {proEnabled ? (
            <>
              <Text style={styles.label}>Confidence: {Math.round(proSignals.confidence * 100)}%</Text>
              {proSignals.anomalies.length === 0 ? <Text style={styles.label}>No anomalies detected.</Text> : null}
              {proSignals.anomalies.map((a) => (
                <Text key={a.day} style={styles.label}>
                  {a.day}: {formatCurrencyPrivacy(a.value, currency, privacyMode)}
                </Text>
              ))}
              <NeonButton label="Export Netrunner Report" onPress={() => router.push('/(screens)/screen_18_backup_restore')} />
            </>
          ) : (
            <Text style={styles.label}>
              Enable PRO TRIAL to unlock anomaly scans, confidence score, and advanced what-if tools.
            </Text>
          )}
        </CyberpunkCard>

        <CyberpunkCard>
          <Text style={styles.cardTitle}>Forecast</Text>
          <Text style={styles.label}>
            {summary.forecast ? `Projected goal date: ${toDateKey(summary.forecast)}` : 'Need more deposits for reliable forecast.'}
          </Text>
        </CyberpunkCard>

        <NeonButton label="Open Risk Simulator" onPress={() => router.push('/(screens)/screen_31_risk_simulator')} />
      </ScrollView>
      <CommsFloatingPing />
      <BottomNavBar currentIndex={1} onPress={(index) => router.push(bottomNavRoutes[index])} />
    </View>
  );
}

const axisStyle = {
  axis: { stroke: 'rgba(255,255,255,0.15)' },
  tickLabels: { fill: baseColors.textMuted, fontSize: 10 },
  grid: { stroke: 'rgba(255,255,255,0.06)' },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 16, paddingTop: 56, gap: 12 },
  content: { gap: 14, paddingBottom: 20 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  toggleRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  metricsGrid: { gap: 12 },
  value: { color: baseColors.cyan, fontFamily: fontFamilies.headingBold, fontSize: 24, marginBottom: 8 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
});

