import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { addDays, format } from 'date-fns';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import { playUnlockSound, triggerMediumHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateRemainingAmount, formatCurrencyPrivacy } from '@/utils';

export default function Screen22SavingsPlan() {
  const params = useLocalSearchParams<{ goalId?: string }>();

  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const goals = useGoalsStore((state) => state.goals);
  const updateGoal = useGoalsStore((state) => state.updateGoal);

  const goal = useMemo(() => {
    const fromParam = params.goalId ? goals.find((item) => item.id === params.goalId) ?? null : null;
    const fromActive = activeGoalId ? goals.find((item) => item.id === activeGoalId) ?? null : null;
    return fromParam ?? fromActive ?? goals[0] ?? null;
  }, [activeGoalId, goals, params.goalId]);

  const [days, setDays] = useState('60');

  const plans = useMemo(() => {
    if (!goal) {
      return [];
    }
    const remaining = calculateRemainingAmount(goal);
    const baseDays = Math.max(Number(days) || 60, 1);
    return [
      {
        key: 'aggressive',
        label: 'Aggressive',
        daily: Math.ceil(remaining / Math.max(baseDays / 2, 1)),
        tone: 'Fastest route with higher pressure.',
        cadence: 'Expect larger daily effort and minimal slack.',
      },
      {
        key: 'balanced',
        label: 'Balanced',
        daily: Math.ceil(remaining / baseDays),
        tone: 'Steady pace designed for consistency.',
        cadence: 'Best if you want sustainable automation.',
      },
      {
        key: 'weekend',
        label: 'Weekend',
        daily: Math.ceil(remaining / Math.max(Math.floor(baseDays / 3), 1)),
        tone: 'Heavier deposits with more flexible weekdays.',
        cadence: 'Good for burst saving instead of constant effort.',
      },
    ] as const;
  }, [days, goal]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>SAVINGS PLAN</Text>
      <CyberpunkCard>
        <Text style={styles.label}>Target horizon (days)</Text>
        <TextInput keyboardType="numeric" onChangeText={setDays} style={styles.input} value={days} />
        {goal ? (
          <Text style={styles.meta}>
            Remaining to goal: {formatCurrencyPrivacy(calculateRemainingAmount(goal), currency, privacyMode)}
          </Text>
        ) : null}
      </CyberpunkCard>
      {plans.map((plan) => {
        const targetDate = format(addDays(new Date(), Math.max(Number(days) || 60, 1)), 'dd.MM.yyyy');
        return (
          <CyberpunkCard key={plan.key} borderColor={goal?.activePlanType === plan.key ? baseColors.green : baseColors.border}>
            <Text style={styles.planTitle}>{plan.label}</Text>
            <Text style={styles.meta}>{plan.tone}</Text>
            <Text style={styles.daily}>{formatCurrencyPrivacy(plan.daily, currency, privacyMode)} recommended daily pace</Text>
            <Text style={styles.planMeta}>Weekly pace: {formatCurrencyPrivacy(plan.daily * 7, currency, privacyMode)}</Text>
            <Text style={styles.planMeta}>Monthly pace: {formatCurrencyPrivacy(plan.daily * 30, currency, privacyMode)}</Text>
            <Text style={styles.planMeta}>Projection target date: {targetDate}</Text>
            <Text style={styles.planHint}>{plan.cadence}</Text>
            <NeonButton
              label={`Activate ${plan.label}`}
              onPress={() => {
                if (!goal) {
                  return;
                }
                updateGoal(goal.id, { activePlanType: plan.key, recommendedDailyAmount: plan.daily, mode: 'auto' });
                void Promise.all([triggerMediumHaptic(), playUnlockSound()]);
              }}
            />
          </CyberpunkCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  planTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 8 },
  daily: { color: baseColors.green, fontFamily: fontFamilies.accentBold, marginBottom: 10 },
  planMeta: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodyMedium, marginBottom: 4 },
  planHint: { color: baseColors.warning, fontFamily: fontFamilies.body, lineHeight: 22, marginVertical: 10 },
});