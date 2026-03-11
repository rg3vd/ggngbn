import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import DigitalRain from '@/components/DigitalRain';
import GlitchText from '@/components/GlitchText';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';

const bootLines = [
  'NEURAL SAVINGS INTERFACE',
  'SYNCING PROFILE MEMORY',
  'VERIFYING GOAL TELEMETRY',
  'SPINNING UP DREAM ENGINE',
];

export default function Screen01Splash() {
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  const briefingShown = useSettingsStore((state) => state.briefingShown);
  const goals = useGoalsStore((state) => state.goals);
  const pulse = useRef(new Animated.Value(0.7)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.72, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    Animated.timing(progress, { toValue: 1, duration: 2200, useNativeDriver: false }).start();

    const timeout = setTimeout(() => {
      if (!onboardingComplete) {
        router.replace('/(screens)/screen_00_onboarding');
        return;
      }

      if (!briefingShown) {
        router.replace('/(screens)/screen_30_briefing');
        return;
      }

      router.replace(goals.length === 0 ? '/(screens)/screen_02_goal_config' : '/(screens)/screen_03_dashboard');
    }, 2500);

    return () => {
      animation.stop();
      clearTimeout(timeout);
      pulse.stopAnimation();
      progress.stopAnimation();
    };
  }, [briefingShown, goals.length, onboardingComplete, progress, pulse]);

  const bootProgressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', '96%'],
  });

  const randomId = useMemo(() => Math.floor(1000 + Math.random() * 8999), []);

  return (
    <View style={styles.screen}>
      <DigitalRain opacity={0.18} dense />
      <View style={styles.vignette} />
      <Animated.View style={[styles.orb, { opacity: pulse, transform: [{ scale: pulse }] }]} />
      <View style={styles.center}>
        <Text style={styles.kicker}>BOOT // DREAM_VAULT_{randomId}</Text>
        <GlitchText text="СКАРБНИЧКА МРІЇ" style={styles.title} />
        <Text style={styles.subtitle}>CYBER SAVINGS OS // SYSTEM BOOTING...</Text>
        <View style={styles.progressShell}>
          <Animated.View style={[styles.progressFill, { width: bootProgressWidth }]} />
        </View>
        <View style={styles.bootPanel}>
          {bootLines.map((line, index) => (
            <View key={line} style={styles.bootRow}>
              <Text style={styles.bootIndex}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.bootText}>{line}</Text>
              <Text style={styles.bootState}>OK</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  orb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(0,245,255,0.08)',
    shadowColor: baseColors.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  center: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  kicker: {
    color: baseColors.textSecondary,
    fontFamily: fontFamilies.accentBold,
    letterSpacing: 2.2,
    fontSize: 12,
  },
  title: {
    fontSize: 34,
    color: baseColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: baseColors.cyan,
    fontFamily: fontFamilies.accentBold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  progressShell: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: baseColors.cyan,
    shadowColor: baseColors.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  bootPanel: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(17,17,26,0.72)',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  bootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bootIndex: {
    width: 24,
    color: baseColors.textMuted,
    fontFamily: fontFamilies.accentBold,
    fontSize: 12,
  },
  bootText: {
    flex: 1,
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  bootState: {
    color: baseColors.green,
    fontFamily: fontFamilies.accentBold,
    fontSize: 12,
    letterSpacing: 1.2,
  },
});
