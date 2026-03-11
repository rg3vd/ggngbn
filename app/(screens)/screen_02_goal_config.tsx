import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import HologramProduct from '@/components/HologramProduct';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { triggerMediumHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { GoalMode, GoalType } from '@/types';
import { baseColors, fontFamilies } from '@/theme';

const goalModes: GoalMode[] = ['casual', 'hardcore', 'auto'];

interface GoalDraft {
  type: GoalType;
  name: string;
  targetAmount: string;
  mode: GoalMode;
}

export default function Screen02GoalConfig() {
  const selectedGoalTypes = useSettingsStore((state) => state.selectedGoalTypes);
  const createGoal = useGoalsStore((state) => state.createGoal);
  const setActiveGoalId = useSettingsStore((state) => state.setActiveGoalId);
  const [drafts, setDrafts] = useState<Record<GoalType, GoalDraft>>({
    ps5: { type: 'ps5', name: 'PlayStation 5', targetAmount: '25000', mode: 'casual' },
    monitor: { type: 'monitor', name: 'Gaming Monitor', targetAmount: '12000', mode: 'casual' },
  });

  const activeDrafts = useMemo<GoalType[]>(() => {
    return selectedGoalTypes.length > 0 ? selectedGoalTypes : ['ps5'];
  }, [selectedGoalTypes]);

  const canContinue = useMemo(() => {
    return activeDrafts.every((type) => {
      const draft = drafts[type];
      return draft.name.trim().length > 0 && Number(draft.targetAmount) > 0;
    });
  }, [activeDrafts, drafts]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>ACTIVATE GOAL</Text>
      <Text style={styles.subtitle}>Configure your mission target{activeDrafts.length === 2 ? 's' : ''} and launch the savings run.</Text>

      {activeDrafts.map((type) => {
        const draft = drafts[type];
        return (
          <CyberpunkCard key={type} borderColor={type === 'ps5' ? baseColors.cyan : baseColors.purple}>
            <View style={styles.cardHeader}>
              <View style={styles.cardMeta}>
                <Text style={styles.sectionTitle}>{type.toUpperCase()}</Text>
                <Text style={styles.helper}>Neon mission profile</Text>
              </View>
              <HologramProduct goalType={type} progress={0.18} size={90} />
            </View>
            <Text style={styles.label}>Goal Name</Text>
            <TextInput onChangeText={(value) => setDrafts((prev) => ({ ...prev, [type]: { ...prev[type], name: value } }))} style={styles.input} value={draft.name} />
            <Text style={styles.label}>Target Amount</Text>
            <TextInput keyboardType="numeric" onChangeText={(value) => setDrafts((prev) => ({ ...prev, [type]: { ...prev[type], targetAmount: value } }))} style={styles.input} value={draft.targetAmount} />
            <Text style={styles.label}>Pace Mode</Text>
            <View style={styles.rowWrap}>
              {goalModes.map((mode) => (
                <NeonChip key={mode} isSelected={draft.mode === mode} label={mode} onPress={() => setDrafts((prev) => ({ ...prev, [type]: { ...prev[type], mode } }))} />
              ))}
            </View>
          </CyberpunkCard>
        );
      })}

      <NeonButton
        label="Start Mission"
        onPress={() => {
          if (!canContinue) {
            return;
          }

          let firstGoalId: string | null = null;
          activeDrafts.forEach((type) => {
            const draft = drafts[type];
            const goal = createGoal({
              type: draft.type,
              name: draft.name.trim(),
              targetAmount: Number(draft.targetAmount),
              mode: draft.mode,
            });
            firstGoalId ??= goal.id;
          });
          if (firstGoalId) {
            setActiveGoalId(firstGoalId);
          }
          void triggerMediumHaptic();
          router.replace('/(screens)/screen_30_briefing');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, gap: 18, paddingTop: 72 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 30, letterSpacing: 1.8 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardMeta: { gap: 4 },
  sectionTitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2 },
  helper: { color: baseColors.textMuted, fontFamily: fontFamilies.body },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  rowWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', color: baseColors.textPrimary, fontFamily: fontFamilies.body, paddingHorizontal: 14, marginBottom: 14, backgroundColor: 'rgba(10,10,15,0.78)' },
});
