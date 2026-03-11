import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addDays, format } from 'date-fns';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonChip from '@/components/NeonChip';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateRemainingAmount, formatCurrencyPrivacy } from '@/utils';

const chartWidth = Dimensions.get('window').width - 56;

const seededRandom = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    // xorshift32
    t ^= t << 13;
    t ^= t >>> 17;
    t ^= t << 5;
    return ((t >>> 0) % 10000) / 10000;
  };
};

const simulateFinishDays = (remaining: number, dailyAmount: number, daysPerWeek: number, missChance: number, runs: number, seed: number): number[] => {
  if (remaining <= 0) {
    return [0];
  }
  const rand = seededRandom(seed);
  const results: number[] = [];
  const cadence = Math.max(1, Math.min(7, Math.floor(daysPerWeek)));
  const amount = Math.max(1, Math.floor(dailyAmount));
  const miss = Math.max(0, Math.min(0.4, missChance));

  for (let run = 0; run < runs; run += 1) {
    let saved = 0;
    let days = 0;
    let depositsThisWeek = 0;

    while (saved < remaining && days < 3660) {
      days += 1;

      // reset weekly budget every 7 days
      if (days % 7 === 1) {
        depositsThisWeek = 0;
      }

      if (depositsThisWeek >= cadence) {
        continue;
      }

      const willMiss = rand() < miss;
      if (willMiss) {
        continue;
      }

      saved += amount;
      depositsThisWeek += 1;
    }

    results.push(days);
  }

  return results.sort((a, b) => a - b);
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
};

const computeConfidence = (depositDays: number, volatility: number): number => {
  const base = Math.min(1, depositDays / 14);
  const penalty = Math.max(0, Math.min(0.6, volatility));
  return Math.max(0.1, Math.min(0.95, base * (1 - penalty)));
};

export default function Screen31RiskSimulator() {
  const proEnabled = useSettingsStore((state) => state.proEnabled);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const goals = useGoalsStore((state) => state.goals.filter((g) => !g.archived));
  const goal = goals.find((g) => g.id === activeGoalId) ?? goals[0] ?? null;

  const [dailyAmount, setDailyAmount] = useState('150');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [missChance, setMissChance] = useState('0.10');

  const remaining = goal ? calculateRemainingAmount(goal) : 0;
  const seed = useMemo(() => {
    const base = (goal?.id ?? 'seed').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const week = new Date().getDay();
    return base + week * 997;
  }, [goal?.id]);

  const model = useMemo(() => {
    const daily = Number(dailyAmount) || 0;
    const cadence = Number(daysPerWeek) || 0;
    const miss = proEnabled ? Number(missChance) || 0 : 0;

    const runs = proEnabled ? 400 : 220;
    const dist = simulateFinishDays(remaining, daily, cadence, miss, runs, seed);

    const p10 = percentile(dist, 0.1);
    const p50 = percentile(dist, 0.5);
    const p90 = percentile(dist, 0.9);

    const volatility = dist.length > 0 ? (p90 - p10) / Math.max(p50, 1) : 0;
    const confidence = computeConfidence(dist.length, volatility);

    const series = [
      { x: 10, y: p10 },
      { x: 50, y: p50 },
      { x: 90, y: p90 },
    ];

    return { dist, p10, p50, p90, confidence, volatility, series };
  }, [dailyAmount, daysPerWeek, missChance, proEnabled, remaining, seed]);

  const medianDate = useMemo(() => {
    return format(addDays(new Date(), model.p50), 'dd.MM.yyyy');
  }, [model.p50]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>RISK SIMULATOR</Text>
      <Text style={styles.subtitle}>What-if engine. Local-first прогноз із неоновою телеметрією.</Text>

      <CyberpunkCard>
        <Text style={styles.label}>Target</Text>
        <Text style={styles.value}>{goal ? goal.name : 'No active goal'}</Text>
        <Text style={styles.meta}>Remaining: {formatCurrencyPrivacy(remaining, currency, privacyMode)}</Text>
      </CyberpunkCard>

      <CyberpunkCard>
        <Text style={styles.label}>Daily Amount</Text>
        <TextInput keyboardType="numeric" value={dailyAmount} onChangeText={setDailyAmount} style={styles.input} />
        <Text style={styles.label}>Days / Week</Text>
        <TextInput keyboardType="numeric" value={daysPerWeek} onChangeText={setDaysPerWeek} style={styles.input} />
        {proEnabled ? (
          <>
            <Text style={styles.label}>Miss Chance (0.00–0.40)</Text>
            <TextInput keyboardType="numeric" value={missChance} onChangeText={setMissChance} style={styles.input} />
          </>
        ) : (
          <Text style={styles.proHint}>PRO: увімкни ризик‑параметри (miss chance) і розширені бенди.</Text>
        )}
      </CyberpunkCard>

      <CyberpunkCard>
        <Text style={styles.cardTitle}>Projection</Text>
        <Text style={styles.meta}>Median finish: {medianDate}</Text>
        <Text style={styles.meta}>Best band (p10): {model.p10}d • Worst band (p90): {model.p90}d</Text>
        <Text style={styles.meta}>Confidence: {Math.round(model.confidence * 100)}%</Text>
        <VictoryChart width={chartWidth} height={240} theme={VictoryTheme.material} domainPadding={18}>
          <VictoryAxis style={axisStyle} />
          <VictoryAxis dependentAxis style={axisStyle} />
          <VictoryLine data={model.series} interpolation="monotoneX" style={{ data: { stroke: baseColors.cyan, strokeWidth: 3 } }} />
        </VictoryChart>
        <View style={styles.pills}>
          <NeonChip label={proEnabled ? 'PRO ON' : 'PRO OFF'} isSelected={proEnabled} onPress={() => useSettingsStore.getState().setProEnabled(!proEnabled)} />
        </View>
      </CyberpunkCard>
    </ScrollView>
  );
}

const axisStyle = {
  axis: { stroke: 'rgba(255,255,255,0.15)' },
  tickLabels: { fill: baseColors.textMuted, fontSize: 10 },
  grid: { stroke: 'rgba(255,255,255,0.06)' },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  value: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 6 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 4 },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  proHint: { color: baseColors.warning, fontFamily: fontFamilies.bodyMedium, lineHeight: 22 },
  pills: { flexDirection: 'row', gap: 10, marginTop: 10 },
});
