import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { playUnlockSound, triggerMediumHaptic } from '@/services';
import { useContractsStore } from '@/store/contractsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ContractTier } from '@/types';
import { baseColors, fontFamilies } from '@/theme';
import { calculateGoalProgress, formatCurrencyPrivacy } from '@/utils';

const tiers: Array<{ tier: ContractTier; title: string; description: string; color: string }> = [
  {
    tier: 'safe',
    title: 'SAFE MODE',
    description: '1 grace/day per week. System tries to keep your streak alive without harsh penalties.',
    color: baseColors.cyan,
  },
  {
    tier: 'hardcore',
    title: 'HARDCORE CONTRACT',
    description: 'No grace. If you miss a day, only shields can prevent a System Failure.',
    color: baseColors.warning,
  },
  {
    tier: 'rogue',
    title: 'ROGUE-LIKE',
    description: 'No grace. Missed days can drop your rank. Shields help you survive the run.',
    color: baseColors.pink,
  },
];

export default function Screen32Contracts() {
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const goals = useGoalsStore((state) => state.goals.filter((g) => !g.archived));
  const goal = goals.find((g) => g.id === activeGoalId) ?? goals[0] ?? null;

  const contracts = useContractsStore((state) => state.contracts);
  const ensureContract = useContractsStore((state) => state.ensureContract);
  const setTier = useContractsStore((state) => state.setTier);

  useEffect(() => {
    if (goal) {
      ensureContract(goal);
    }
  }, [ensureContract, goal]);

  const contract = goal ? contracts[goal.id] ?? null : null;
  const graceLeft = contract?.tier === 'safe' ? Math.max(contract.gracePerWeek - contract.graceUsedDateKeys.length, 0) : 0;
  const progress = goal ? calculateGoalProgress(goal) : 0;

  const title = useMemo(() => {
    if (!goal) {
      return 'CONTRACTS';
    }
    return `CONTRACTS // ${goal.name}`;
  }, [goal]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      {!goal ? (
        <CyberpunkCard>
          <Text style={styles.meta}>No active goal. Create a goal to assign a contract.</Text>
        </CyberpunkCard>
      ) : (
        <>
          <CyberpunkCard>
            <Text style={styles.cardTitle}>Current status</Text>
            <Text style={styles.meta}>Tier: {(contract?.tier ?? 'safe').toUpperCase()}</Text>
            <Text style={styles.meta}>Progress: {Math.round(progress * 100)}%</Text>
            <Text style={styles.meta}>Saved: {formatCurrencyPrivacy(goal.currentAmount, currency, privacyMode)} / {formatCurrencyPrivacy(goal.targetAmount, currency, privacyMode)}</Text>
            <Text style={styles.meta}>Shields: {contract?.shields ?? 0}</Text>
            <Text style={styles.meta}>Grace left this week: {graceLeft}</Text>
            <Text style={styles.meta}>Rogue rank: {contract?.tier === 'rogue' ? `${contract.rank} (${contract.rankXP}xp)` : 'N/A'}</Text>
          </CyberpunkCard>

          {tiers.map((t) => (
            <CyberpunkCard key={t.tier} borderColor={t.color}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.meta}>{t.description}</Text>
              <NeonChip
                label={contract?.tier === t.tier ? 'ACTIVE' : 'ACTIVATE'}
                isSelected={contract?.tier === t.tier}
                onPress={() => {
                  setTier(goal.id, t.tier);
                  void Promise.all([triggerMediumHaptic(), playUnlockSound()]);
                }}
                color={t.color}
              />
            </CyberpunkCard>
          ))}

          <CyberpunkCard>
            <Text style={styles.cardTitle}>Tools</Text>
            <View style={styles.actions}>
              <NeonButton label="Mission Routes" onPress={() => router.push('/(screens)/screen_33_mission_routes')} />
              <NeonButton label="Risk Simulator" onPress={() => router.push('/(screens)/screen_31_risk_simulator')} />
            </View>
          </CyberpunkCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 8 },
  actions: { gap: 10 },
});
