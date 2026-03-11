import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import CrtScanlineLayer from '@/components/CrtScanlineLayer';
import { initI18n } from '@/i18n';
import { refreshSmartReminders } from '@/services';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useChallengeStore } from '@/store/challengeStore';
import { useCommsStore } from '@/store/commsStore';
import { useContractsStore } from '@/store/contractsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useMissionRoutesStore } from '@/store/missionRoutesStore';
import { usePriceNodeStore } from '@/store/priceNodeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useStreakStore } from '@/store/streakStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, themePresets } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  const language = useSettingsStore((state) => state.language);
  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const crtEnabled = useSettingsStore((state) => state.visualFx.crtEnabled);

  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateGoals = useGoalsStore((state) => state.hydrate);
  const hydrateTransactions = useTransactionsStore((state) => state.hydrate);
  const hydrateContracts = useContractsStore((state) => state.hydrate);
  const hydrateMissionRoutes = useMissionRoutesStore((state) => state.hydrate);
  const hydratePriceNode = usePriceNodeStore((state) => state.hydrate);
  const hydrateAchievements = useAchievementsStore((state) => state.hydrate);
  const hydrateChallenges = useChallengeStore((state) => state.hydrate);
  const hydrateComms = useCommsStore((state) => state.hydrate);
  const hydrateStreaks = useStreakStore((state) => state.hydrate);

  const settingsHydrated = useSettingsStore((state) => state.hydrated);
  const goalsHydrated = useGoalsStore((state) => state.hydrated);
  const txHydrated = useTransactionsStore((state) => state.hydrated);

  const [fontsLoaded] = useFonts({
    'Orbitron-Regular': require('../assets/fonts/Orbitron-Regular.ttf'),
    'Orbitron-Bold': require('../assets/fonts/Orbitron-Bold.ttf'),
    'Rajdhani-SemiBold': require('../assets/fonts/Rajdhani-SemiBold.ttf'),
    'Rajdhani-Bold': require('../assets/fonts/Rajdhani-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    hydrateSettings();
    hydrateGoals();
    hydrateContracts();
    hydrateMissionRoutes();
    hydratePriceNode();
    hydrateAchievements();
    hydrateChallenges();
    hydrateComms();
    hydrateStreaks();
    hydrateTransactions();
  }, [
    hydrateAchievements,    hydrateChallenges,
    hydrateComms,
    hydrateContracts,
    hydrateGoals,
    hydrateMissionRoutes,
    hydratePriceNode,
    hydrateSettings,
    hydrateStreaks,
    hydrateTransactions,
  ]);

  useEffect(() => {
    if (!settingsHydrated || !goalsHydrated || !txHydrated) {
      return;
    }
    void refreshSmartReminders(useGoalsStore.getState().goals, useTransactionsStore.getState().transactions, useSettingsStore.getState());
  }, [goalsHydrated, settingsHydrated, txHydrated]);

  useEffect(() => {
    initI18n(language)
      .then(() => setI18nReady(true))
      .finally(() => {
        SplashScreen.hideAsync().catch(() => undefined);
      });
  }, [language]);

  const ready = fontsLoaded && i18nReady;
  const accent = themePresets[activeTheme]?.accent ?? baseColors.cyan;

  const content = useMemo(() => {
    if (!ready) {
      return (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={baseColors.cyan} size="large" />
        </View>
      );
    }

    return (
      <View style={styles.shell}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: baseColors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(screens)/screen_00_onboarding" />
          <Stack.Screen name="(screens)/screen_01_splash" />
          <Stack.Screen name="(screens)/screen_02_goal_config" />
          <Stack.Screen name="(screens)/screen_03_dashboard" />
          <Stack.Screen name="(screens)/screen_04_add_deposit" />
          <Stack.Screen name="(screens)/screen_05_analytics" />
          <Stack.Screen name="(screens)/screen_06_history" />
          <Stack.Screen name="(screens)/screen_07_achievements" />
          <Stack.Screen name="(screens)/screen_08_profile" />
          <Stack.Screen name="(screens)/screen_09_dual_goal" />
          <Stack.Screen name="(screens)/screen_10_victory" />
          <Stack.Screen name="(screens)/screen_11_edit_goal" />
          <Stack.Screen name="(screens)/screen_12_edit_deposit" />
          <Stack.Screen name="(screens)/screen_13_calendar" />
          <Stack.Screen name="(screens)/screen_14_streak_details" />
          <Stack.Screen name="(screens)/screen_15_notification_settings" />
          <Stack.Screen name="(screens)/screen_16_archive" />
          <Stack.Screen name="(screens)/screen_17_tutorial" />
          <Stack.Screen name="(screens)/screen_18_backup_restore" />
          <Stack.Screen name="(screens)/screen_19_currency_converter" />
          <Stack.Screen name="(screens)/screen_20_about" />
          <Stack.Screen name="(screens)/screen_21_goal_detail" />
          <Stack.Screen name="(screens)/screen_22_savings_plan" />
          <Stack.Screen name="(screens)/screen_23_records" />
          <Stack.Screen name="(screens)/screen_24_quick_deposit" />
          <Stack.Screen name="(screens)/screen_25_daily_challenge" />
          <Stack.Screen name="(screens)/screen_26_mood_log" />
          <Stack.Screen name="(screens)/screen_27_comparison" />
          <Stack.Screen name="(screens)/screen_28_themes_store" />
          <Stack.Screen name="(screens)/screen_29_insights" />
          <Stack.Screen name="(screens)/screen_30_briefing" />
          <Stack.Screen name="(screens)/screen_31_risk_simulator" />
          <Stack.Screen name="(screens)/screen_32_contracts" />
          <Stack.Screen name="(screens)/screen_33_mission_routes" />
          <Stack.Screen name="(screens)/screen_34_comms" />
        </Stack>
        <CrtScanlineLayer enabled={crtEnabled} accentColor={accent} />
      </View>
    );
  }, [accent, crtEnabled, ready]);

  return <GestureHandlerRootView style={styles.root}>{content}</GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  shell: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: baseColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});




