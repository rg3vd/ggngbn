import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { motivationalPhrases } from '@/constants';
import { playSuccessChimeSound, triggerMediumHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { TransactionMood } from '@/types';
import { baseColors, fontFamilies } from '@/theme';

const moods: Array<{ label: string; value: TransactionMood }> = [
  { label: 'Hyped', value: 'hyped' },
  { label: 'Disciplined', value: 'disciplined' },
  { label: 'Routine', value: 'routine' },
  { label: 'Forced', value: 'forced' },
];

export default function Screen04AddDeposit() {
  const params = useLocalSearchParams<{ goalId?: string; prefillAmount?: string }>();

  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [mood, setMood] = useState<TransactionMood>(null);

  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const setLastQuickDepositAmount = useSettingsStore((state) => state.setLastQuickDepositAmount);
  const addTransaction = useTransactionsStore((state) => state.addTransaction);

  const activeGoal = useMemo(() => {
    const fromParam = params.goalId ? goals.find((goal) => goal.id === params.goalId) ?? null : null;
    const fromActive = activeGoalId ? goals.find((goal) => goal.id === activeGoalId) ?? null : null;
    return fromParam ?? fromActive ?? goals[0] ?? null;
  }, [activeGoalId, goals, params.goalId]);

  useEffect(() => {
    const prefill = params.prefillAmount ? String(params.prefillAmount).trim() : '';
    if (!prefill) {
      return;
    }
    if (amount.trim().length > 0) {
      return;
    }
    setAmount(prefill);
  }, [amount, params.prefillAmount]);

  const phrase = useMemo(() => motivationalPhrases[new Date().getDate() % motivationalPhrases.length], []);

  const error = useMemo(() => {
    if (!amount.trim()) {
      return 'Enter amount';
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return 'Amount must be greater than zero';
    }

    if (activeGoal && numericAmount > activeGoal.targetAmount - activeGoal.currentAmount) {
      return 'Amount exceeds remaining balance';
    }

    return '';
  }, [activeGoal, amount]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>ADD DEPOSIT</Text>
      <CyberpunkCard>
        <Text style={styles.sectionLabel}>Target</Text>
        <Text style={styles.targetName}>{activeGoal ? activeGoal.name : 'No active goal'}</Text>

        <Text style={styles.sectionLabel}>Amount</Text>
        <TextInput keyboardType="numeric" onChangeText={setAmount} style={styles.input} value={amount} />

        <Text style={styles.sectionLabel}>Comment</Text>
        <TextInput onChangeText={setComment} style={[styles.input, styles.comment]} value={comment} />

        <Text style={styles.sectionLabel}>Mood Tag</Text>
        <View style={styles.rowWrap}>
          {moods.map((item) => (
            <NeonChip key={item.label} label={item.label} isSelected={mood === item.value} onPress={() => setMood(item.value)} />
          ))}
        </View>

        <Text style={styles.phrase}>{phrase}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </CyberpunkCard>
      <NeonButton
        label="Confirm Deposit"
        onPress={() => {
          if (!activeGoal || error) {
            Alert.alert('Validation', error || 'No active goal available');
            return;
          }

          const numericAmount = Number(amount);
          setLastQuickDepositAmount(numericAmount);
          addTransaction({
            goalId: activeGoal.id,
            amount: numericAmount,
            date: new Date().toISOString(),
            comment: comment.trim(),
            mood,
          });
          void Promise.all([triggerMediumHaptic(), playSuccessChimeSound()]);
          router.replace('/(screens)/screen_03_dashboard');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 18 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  sectionLabel: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  targetName: { color: baseColors.cyan, fontFamily: fontFamilies.headingBold, fontSize: 16, marginTop: -6, marginBottom: 14 },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  comment: { minHeight: 88, textAlignVertical: 'top', paddingTop: 14 },
  rowWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 12 },
  phrase: { color: baseColors.green, fontFamily: fontFamilies.bodyMedium, lineHeight: 22, marginBottom: 10 },
  error: { color: baseColors.danger, fontFamily: fontFamilies.bodyMedium },
});