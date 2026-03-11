import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import NeonButton from '@/components/NeonButton';
import ProgressRing from '@/components/ProgressRing';
import { applyWidgetSnapshot, buildQuickWidgetSnapshot, triggerMediumHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateGoalProgress, formatCurrencyPrivacy } from '@/utils';

export default function Screen24QuickDeposit() {
  const params = useLocalSearchParams<{ goalId?: string }>();

  const [amount, setAmount] = useState(100);
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const lastQuickDepositAmount = useSettingsStore((state) => state.lastQuickDepositAmount);
  const setLastQuickDepositAmount = useSettingsStore((state) => state.setLastQuickDepositAmount);

  const goals = useGoalsStore((state) => state.goals);
  const goal = useMemo(() => {
    const fromParam = params.goalId ? goals.find((item) => item.id === params.goalId) ?? null : null;
    const fromActive = activeGoalId ? goals.find((item) => item.id === activeGoalId) ?? null : null;
    return fromParam ?? fromActive ?? goals[0] ?? null;
  }, [activeGoalId, goals, params.goalId]);

  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  const widgetSnapshot = useMemo(() => buildQuickWidgetSnapshot(goal), [goal]);

  const accent = goal?.type === 'ps5' ? baseColors.cyan : baseColors.purple;
  const pct = goal ? Math.round(calculateGoalProgress(goal) * 100) : 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>QUICK DEPOSIT</Text>
        {goal ? (
          <ProgressRing color={accent} progress={calculateGoalProgress(goal)} size={72}>
            <Text style={styles.percent}>{pct}%</Text>
          </ProgressRing>
        ) : null}
      </View>

      <Text style={[styles.amount, { color: accent }]}>{formatCurrencyPrivacy(amount, currency, privacyMode)}</Text>

      <View style={styles.row}>
        {[50, 100, 200, 500].map((value) => (
          <NeonButton key={value} label={`+${value}`} onPress={() => setAmount(value)} />
        ))}
      </View>

      <Text style={styles.hint}>Last quick amount: {formatCurrencyPrivacy(lastQuickDepositAmount, currency, privacyMode)}</Text>
      <Text style={styles.widgetHint}>Widget preview: {widgetSnapshot.title} • {widgetSnapshot.progressPercent}%</Text>

      <NeonButton
        label="Deposit Now"
        onPress={() => {
          if (!goal) {
            return;
          }
          setLastQuickDepositAmount(amount);
          addTransaction({ goalId: goal.id, amount, date: new Date().toISOString(), comment: '', mood: null });
          void Promise.all([triggerMediumHaptic(), applyWidgetSnapshot(buildQuickWidgetSnapshot(goal))]);
          router.replace('/(screens)/screen_03_dashboard');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 20, paddingTop: 72, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  percent: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 16 },
  amount: { fontFamily: fontFamilies.headingBold, fontSize: 42, textAlign: 'center', marginVertical: 24 },
  row: { gap: 10 },
  hint: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, textAlign: 'center' },
  widgetHint: { color: baseColors.pink, fontFamily: fontFamilies.accentBold, textAlign: 'center' },
});