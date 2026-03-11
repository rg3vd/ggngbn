import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import GlitchText from '@/components/GlitchText';
import HologramProduct from '@/components/HologramProduct';
import NeonButton from '@/components/NeonButton';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateForecastDate, formatCurrencyPrivacy, formatDisplayDate } from '@/utils';
import { useTransactionsStore } from '@/store/transactionsStore';

export default function Screen30Briefing() {
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const setBriefingShown = useSettingsStore((state) => state.setBriefingShown);
  const nickname = useSettingsStore((state) => state.nickname);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const goals = useGoalsStore((state) => state.goals);
  const transactions = useTransactionsStore((state) => state.transactions);
  const goal = goals.find((item) => item.id === activeGoalId) ?? goals[0] ?? null;
  const forecast = goal ? calculateForecastDate(goal, transactions) : null;

  return (
    <View style={styles.screen}>
      <GlitchText text={`MISSION BRIEFING, ${nickname || 'AGENT'}`} style={styles.title} />
      {goal ? (
        <>
          <HologramProduct goalType={goal.type} progress={goal.currentAmount / goal.targetAmount} size={220} />
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.meta}>Target: {formatCurrencyPrivacy(goal.targetAmount, currency, privacyMode)}</Text>
          <Text style={styles.meta}>Mode: {goal.mode.toUpperCase()}</Text>
          <Text style={styles.meta}>ETA: {forecast ? formatDisplayDate(forecast) : 'Pending deposits'}</Text>
        </>
      ) : (
        <Text style={styles.meta}>No goal configured yet.</Text>
      )}
      <NeonButton
        label="START MISSION"
        onPress={() => {
          setBriefingShown(true);
          router.replace(goal ? '/(screens)/screen_03_dashboard' : '/(screens)/screen_02_goal_config');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.background,
    padding: 20,
    paddingTop: 72,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: baseColors.textPrimary,
    fontSize: 24,
    textAlign: 'center',
  },
  goalName: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.headingBold,
    fontSize: 24,
    textAlign: 'center',
  },
  meta: {
    color: baseColors.textSecondary,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    textAlign: 'center',
  },
});
