import React, { useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import BottomNavBar from '@/components/BottomNavBar';
import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import ProgressRing from '@/components/ProgressRing';
import { bottomNavRoutes } from '@/constants';
import { playButtonTapSound, triggerLightHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateGoalProgress, formatCurrencyPrivacy } from '@/utils';

export default function Screen09DualGoal() {
  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const lastQuickDepositAmount = useSettingsStore((state) => state.lastQuickDepositAmount);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const [split, setSplit] = useState(50);

  if (goals.length < 2) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>DUAL GOAL</Text>
          <CyberpunkCard>
            <Text style={styles.emptyTitle}>Second goal is not active yet.</Text>
            <Text style={styles.emptySubtitle}>Create another mission target to unlock split progress and comparison mode.</Text>
          </CyberpunkCard>
          <NeonButton label="Activate Second Goal" onPress={() => router.push('/(screens)/screen_02_goal_config')} />
        </ScrollView>
        <BottomNavBar currentIndex={0} onPress={(index) => router.push(bottomNavRoutes[index])} />
      </View>
    );
  }

  const [leftGoal, rightGoal] = goals.slice(0, 2);
  const leftProgress = calculateGoalProgress(leftGoal);
  const rightProgress = calculateGoalProgress(rightGoal);
  const leftAccent = leftGoal.type === 'ps5' ? baseColors.cyan : baseColors.purple;
  const rightAccent = rightGoal.type === 'ps5' ? baseColors.cyan : baseColors.purple;
  const leftSuggested = Math.round((lastQuickDepositAmount * split) / 100);
  const rightSuggested = Math.max(lastQuickDepositAmount - leftSuggested, 0);
  const leader = leftProgress === rightProgress ? 'Tie' : leftProgress > rightProgress ? leftGoal.name : rightGoal.name;

  const allocationHint = useMemo(() => {
    if (leftProgress === rightProgress) {
      return 'Both missions are neck-and-neck. A balanced split keeps momentum stable.';
    }

    return leftProgress < rightProgress
      ? `${leftGoal.name} is behind, so a heavier left-side split helps equalize completion speed.`
      : `${rightGoal.name} is behind, so leaning right can reduce mission drift.`;
  }, [leftGoal.name, leftProgress, rightGoal.name, rightProgress]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>DUAL GOAL</Text>
        <Text style={styles.subtitle}>Split a deposit mentally before you commit it in the main flow.</Text>
        <View style={styles.dualRow}>
          {[leftGoal, rightGoal].map((goal) => {
            const progress = calculateGoalProgress(goal);
            const accent = goal.type === 'ps5' ? baseColors.cyan : baseColors.purple;
            return (
              <CyberpunkCard key={goal.id}>
                <View style={styles.goalCardBackdrop}>
                  <ImageBackground 
                    source={require('@/assets/images/victory-setup.jpg')} 
                    style={styles.goalCardImage}
                    resizeMode="cover"
                  >
                    <View style={styles.goalCardOverlay} />
                  </ImageBackground>
                  <View style={[styles.goalCardGlow, { backgroundColor: `${accent}12` }]} />
                </View>
                <View style={styles.centered}>
                  <ProgressRing color={accent} progress={progress} size={136}>
                    <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
                  </ProgressRing>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalMeta}>{formatCurrencyPrivacy(goal.currentAmount, currency, privacyMode)} / {formatCurrencyPrivacy(goal.targetAmount, currency, privacyMode)}</Text>
                </View>
              </CyberpunkCard>
            );
          })}
        </View>
        <CyberpunkCard borderColor={baseColors.warning}>
          <Text style={styles.sectionTitle}>Smart split preview</Text>
          <Text style={styles.goalMeta}>Using last quick deposit: {formatCurrencyPrivacy(lastQuickDepositAmount, currency, privacyMode)}</Text>
          <View style={styles.sliderRow}>
            <NeonButton label="-10%" width={94} onPress={() => { setSplit((value) => Math.max(10, value - 10)); void Promise.all([triggerLightHaptic(), playButtonTapSound()]); }} color={leftAccent} />
            <View style={styles.sliderCenter}>
              <Text style={styles.splitValue}>{split}% / {100 - split}%</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFillLeft, { width: `${split}%`, backgroundColor: leftAccent }]} />
                <View style={[styles.sliderFillRight, { width: `${100 - split}%`, backgroundColor: rightAccent }]} />
              </View>
            </View>
            <NeonButton label="+10%" width={94} onPress={() => { setSplit((value) => Math.min(90, value + 10)); void Promise.all([triggerLightHaptic(), playButtonTapSound()]); }} color={rightAccent} />
          </View>
          <Text style={styles.allocation}>{leftGoal.name}: {formatCurrencyPrivacy(leftSuggested, currency, privacyMode)}</Text>
          <Text style={styles.allocation}>{rightGoal.name}: {formatCurrencyPrivacy(rightSuggested, currency, privacyMode)}</Text>
          <Text style={styles.hint}>{allocationHint}</Text>
        </CyberpunkCard>
        <CyberpunkCard>
          <Text style={styles.sectionTitle}>Race status</Text>
          <Text style={styles.goalMeta}>Leader: {leader}</Text>
          <Text style={styles.goalMeta}>Gap: {Math.abs(Math.round((leftProgress - rightProgress) * 100))}%</Text>
        </CyberpunkCard>
      </ScrollView>
      <BottomNavBar currentIndex={0} onPress={(index) => router.push(bottomNavRoutes[index])} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 16, paddingTop: 56, gap: 12 },
  content: { gap: 16, paddingBottom: 20 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  dualRow: { gap: 12 },
  goalCardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  goalCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  goalCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.88)',
  },
  goalCardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: { alignItems: 'center', gap: 12 },
  percent: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20 },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, textAlign: 'center' },
  goalMeta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, textAlign: 'center', lineHeight: 22 },
  emptyTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  emptySubtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  sectionTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 10 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  sliderCenter: { flex: 1, gap: 8 },
  splitValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.accentBold, textAlign: 'center', letterSpacing: 1.4 },
  sliderTrack: { height: 14, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row' },
  sliderFillLeft: { height: '100%' },
  sliderFillRight: { height: '100%' },
  allocation: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, marginBottom: 4 },
  hint: { color: baseColors.warning, fontFamily: fontFamilies.bodyMedium, lineHeight: 22, marginTop: 8 },
});
