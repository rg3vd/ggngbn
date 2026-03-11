import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { playUnlockSound, triggerMediumHaptic } from '@/services';
import { useContractsStore } from '@/store/contractsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useMissionRoutesStore } from '@/store/missionRoutesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy } from '@/utils';

export default function Screen33MissionRoutes() {
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const addCosmeticTokens = useSettingsStore((state) => state.addCosmeticTokens);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const goals = useGoalsStore((state) => state.goals.filter((g) => !g.archived));
  const transactions = useTransactionsStore((state) => state.transactions);

  const refresh = useMissionRoutesStore((state) => state.refresh);
  const missionState = useMissionRoutesStore((state) => state.state);
  const claim = useMissionRoutesStore((state) => state.claim);

  const addShields = useContractsStore((state) => state.addShields);
  const addRankXP = useContractsStore((state) => state.addRankXP);

  useEffect(() => {
    refresh(transactions, activeGoalId);
  }, [activeGoalId, refresh, transactions]);

  const state = missionState;

  const focusLabel = useMemo(() => {
    if (!activeGoalId) {
      return 'FOCUS: NONE';
    }
    const goal = goals.find((g) => g.id === activeGoalId);
    return goal ? `FOCUS: ${goal.name}` : 'FOCUS: UNKNOWN';
  }, [activeGoalId, goals]);

  if (!state) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <Text style={styles.title}>MISSION ROUTES</Text>
        <CyberpunkCard>
          <Text style={styles.meta}>No missions initialized yet. Add a deposit to generate weekly routes.</Text>
        </CyberpunkCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>MISSION ROUTES</Text>
      <CyberpunkCard>
        <Text style={styles.cardTitle}>Week</Text>
        <Text style={styles.meta}>{state.weekAnchorKey}</Text>
        <Text style={styles.meta}>Vault deposit days: {state.vault.depositDayCount}</Text>
        <Text style={styles.meta}>Vault volume: {formatCurrencyPrivacy(state.vault.volumeTotal, currency, privacyMode)}</Text>
        <Text style={styles.meta}>{focusLabel}</Text>
        <Text style={styles.meta}>Focus deposits: {state.focus.depositCount}</Text>
      </CyberpunkCard>

      {state.missions.map((mission) => {
        const completed = state.completedMissionIds.includes(mission.id);
        const claimedAlready = state.claimedMissionIds.includes(mission.id);
        return (
          <CyberpunkCard key={mission.id} borderColor={completed ? baseColors.green : baseColors.border}>
            <Text style={styles.cardTitle}>{mission.title}</Text>
            <Text style={styles.meta}>{mission.description}</Text>
            <Text style={styles.meta}>
              Reward: +{mission.rewardShields} shield • +{mission.rewardRankXP}xp • +{mission.rewardCosmeticTokens} token
            </Text>
            <View style={styles.row}>
              <NeonChip
                label={completed ? 'COMPLETED' : 'IN PROGRESS'}
                isSelected={completed}
                onPress={() => undefined}
                color={completed ? baseColors.green : baseColors.warning}
              />
              <NeonChip
                label={claimedAlready ? 'CLAIMED' : 'CLAIM'}
                isSelected={claimedAlready}
                onPress={() => {
                  if (!completed || claimedAlready) {
                    return;
                  }

                  const contracts = useContractsStore.getState().contracts;
                  goals.forEach((g) => {
                    const c = contracts[g.id];
                    if (!c) {
                      return;
                    }
                    if (c.tier === 'hardcore' || c.tier === 'rogue') {
                      addShields(g.id, mission.rewardShields);
                    }
                    if (c.tier === 'rogue') {
                      addRankXP(g.id, mission.rewardRankXP);
                    }
                  });
                  addCosmeticTokens(mission.rewardCosmeticTokens);
                  claim(mission.id);
                  void Promise.all([triggerMediumHaptic(), playUnlockSound()]);
                }}
                color={claimedAlready ? baseColors.textMuted : baseColors.cyan}
              />
            </View>
          </CyberpunkCard>
        );
      })}

      <NeonButton label="Refresh Routes" onPress={() => refresh(transactions, activeGoalId)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
