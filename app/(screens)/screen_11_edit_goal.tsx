import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { GoalMode } from '@/types';
import { baseColors, fontFamilies } from '@/theme';

const modes: GoalMode[] = ['casual', 'hardcore', 'auto'];

export default function Screen11EditGoal() {
  const params = useLocalSearchParams<{ id?: string }>();

  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const goals = useGoalsStore((state) => state.goals);
  const updateGoal = useGoalsStore((state) => state.updateGoal);

  const goal = useMemo(() => {
    const fromParam = params.id ? goals.find((item) => item.id === params.id) ?? null : null;
    const fromActive = activeGoalId ? goals.find((item) => item.id === activeGoalId) ?? null : null;
    return fromParam ?? fromActive ?? goals[0] ?? null;
  }, [activeGoalId, goals, params.id]);

  const [name, setName] = useState(goal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [mode, setMode] = useState<GoalMode>(goal?.mode ?? 'casual');

  const error = useMemo(() => {
    if (!goal) {
      return 'No goal selected';
    }

    const nextAmount = Number(targetAmount);
    if (!name.trim()) {
      return 'Name is required';
    }
    if (!Number.isFinite(nextAmount) || nextAmount < goal.currentAmount) {
      return 'Target must be greater than or equal to current saved amount';
    }
    return '';
  }, [goal, name, targetAmount]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>EDIT GOAL</Text>
      <CyberpunkCard>
        <Text style={styles.label}>Name</Text>
        <TextInput onChangeText={setName} style={styles.input} value={name} />
        <Text style={styles.label}>Target Amount</Text>
        <TextInput keyboardType="numeric" onChangeText={setTargetAmount} style={styles.input} value={targetAmount} />
      </CyberpunkCard>
      <CyberpunkCard>
        <Text style={styles.label}>Mode</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {modes.map((item) => (
            <NeonChip key={item} isSelected={mode === item} label={item} onPress={() => setMode(item)} />
          ))}
        </ScrollView>
      </CyberpunkCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <NeonButton
        label="Save Goal"
        onPress={() => {
          if (!goal || error) {
            return;
          }
          updateGoal(goal.id, { name: name.trim(), targetAmount: Number(targetAmount), mode });
          router.back();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  error: { color: baseColors.danger, fontFamily: fontFamilies.bodyMedium },
});