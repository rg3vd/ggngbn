import React, { useEffect, useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';

import DigitalRain from '@/components/DigitalRain';
import GlitchText from '@/components/GlitchText';
import HologramProduct from '@/components/HologramProduct';
import NeonButton from '@/components/NeonButton';
import ProgressRing from '@/components/ProgressRing';
import { playVictorySound, triggerHeavyHaptic, triggerLightHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';
import { calculateGoalProgress, calculateRemainingAmount, formatCurrencyPrivacy } from '@/utils';

export default function Screen10Victory() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const [burst, setBurst] = useState(true);
  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));

  const selected = params.goalId ? goals.find((goal) => goal.id === params.goalId) ?? null : null;
  const completed = goals.filter((goal) => calculateGoalProgress(goal) >= 1);
  const goal = selected ?? completed[0] ?? null;

  const accent = goal?.type === 'monitor' ? baseColors.purple : baseColors.green;
  const savedAmount = goal ? formatCurrencyPrivacy(goal.currentAmount, 'UAH', privacyMode) : null;
  const overSave = goal ? Math.max(goal.currentAmount - goal.targetAmount, 0) : 0;

  const stats = useMemo(() => {
    if (!goal) {
      return [];
    }

    return [
      { label: 'TARGET', value: formatCurrencyPrivacy(goal.targetAmount, 'UAH', privacyMode) },
      { label: 'OVERSAVE', value: overSave > 0 ? formatCurrencyPrivacy(overSave, 'UAH', privacyMode) : '0' },
      { label: 'STREAK', value: `${goal.dailyStreak} days` },
      { label: 'STATUS', value: calculateRemainingAmount(goal) === 0 ? 'COMPLETE' : 'ACTIVE' },
    ];
  }, [goal, overSave, privacyMode]);

  useEffect(() => {
    void Promise.all([triggerHeavyHaptic(), playVictorySound()]);
  }, []);

  return (
    <View style={styles.screen}>
      <ImageBackground 
        source={require('@/assets/images/victory-setup.jpg')} 
        style={styles.victoryImage}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay} />
        <View style={styles.glowOverlay} />
      </ImageBackground>
      <DigitalRain opacity={0.12} tint={accent} dense />
      {burst ? <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fadeOut onAnimationEnd={() => setBurst(false)} /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: accent }]}>МІСІЯ ЗАВЕРШЕНА // КАНАЛ ВИНАГОРОДИ ВІДКРИТО</Text>
        <GlitchText text="МРІЯ ДОСЯГНУТА" style={styles.title} />
        {goal ? (
          <>
            <View style={styles.heroFrame}>
              <View style={[styles.heroGlow, { backgroundColor: `${accent}16` }]} />
              <ProgressRing color={accent} progress={Math.max(0, Math.min(1, calculateGoalProgress(goal)))} size={220}>
                <Text style={styles.ringValue}>100%</Text>
                <Text style={styles.ringCaption}>ЗАБЛОКОВАНО</Text>
              </ProgressRing>
              <View style={styles.hologramWrap}>
                <HologramProduct goalType={goal.type} progress={1} size={200} />
              </View>
            </View>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.meta}>{savedAmount} накопичено</Text>
            <Text style={styles.submeta}>Вітаємо! Твоя мрія тепер реальність, а не далека ідея.</Text>
            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <View key={item.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.meta}>Ще немає завершеної мрії.</Text>
        )}
        <View style={styles.buttonStack}>
          <NeonButton
            label="Святкувати знову"
            onPress={async () => {
              setBurst(true);
              await triggerLightHaptic();
              await playVictorySound();
            }}
          />
          <NeonButton label="Назад до панелі" onPress={() => router.replace('/(screens)/screen_03_dashboard')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, paddingTop: 56 },
  victoryImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.75)',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    shadowColor: '#00ffff',
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 48, gap: 18 },
  kicker: { fontFamily: fontFamilies.accentBold, fontSize: 12, letterSpacing: 2.1, textAlign: 'center' },
  title: { color: baseColors.textPrimary, fontSize: 32, textAlign: 'center' },
  heroFrame: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(17,17,26,0.72)',
    gap: 16,
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  hologramWrap: {
    marginTop: -164,
    marginBottom: 8,
  },
  ringValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28 },
  ringCaption: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, fontSize: 11, letterSpacing: 1.8, marginTop: 2 },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 26, textAlign: 'center' },
  meta: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, fontSize: 16 },
  submeta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, textAlign: 'center', lineHeight: 22 },
  statsGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    gap: 8,
  },
  statLabel: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, fontSize: 11, letterSpacing: 1.6 },
  statValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, fontSize: 14 },
  buttonStack: { width: '100%', gap: 10, marginTop: 6 },
});