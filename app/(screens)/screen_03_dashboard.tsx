import React, { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import BottomNavBar from '@/components/BottomNavBar';
import CommsFloatingPing from '@/components/CommsFloatingPing';
import CoinParticle from '@/components/CoinParticle';
import CyberpunkCard from '@/components/CyberpunkCard';
import DigitalRain from '@/components/DigitalRain';
import GlitchText from '@/components/GlitchText';
import HologramProduct from '@/components/HologramProduct';
import NeonButton from '@/components/NeonButton';
import ProgressRing from '@/components/ProgressRing';
import { bottomNavRoutes } from '@/constants';
import { playCoinDropSound, playUnlockSound, triggerLightHaptic, triggerMediumHaptic } from '@/services';
import { getZenRowsApiKey } from '@/services/zenrowsVault';
import { useContractsStore } from '@/store/contractsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { usePriceNodeStore } from '@/store/priceNodeStore';
import { baseColors, fontFamilies } from '@/theme';
import {
  calculateAverageDeposit,
  calculateForecastDate,
  calculateGoalProgress,
  calculatePaceDrift,
  calculateRemainingAmount,
  formatCurrencyPrivacy,
  toDateKey,
} from '@/utils';

const milestoneThresholds = [25, 50, 75, 100];

const getMidnightCountdown = (): string => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function Screen03Dashboard() {
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const setLastQuickDepositAmount = useSettingsStore((state) => state.setLastQuickDepositAmount);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const milestonesSeen = useSettingsStore((state) => state.milestonesSeen);
  const priceFetchMode = useSettingsStore((state) => state.priceNodeSettings.fetchMode);
  const markMilestoneSeen = useSettingsStore((state) => state.markMilestoneSeen);

  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  const transactions = useTransactionsStore((state) => state.transactions);
  const contracts = useContractsStore((state) => state.contracts);
  const ensureSeededPrice = usePriceNodeStore((state) => state.ensureSeeded);

  const [particleAmount, setParticleAmount] = useState<number | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<string>('');
  const [countdown, setCountdown] = useState(getMidnightCountdown());
  const [priceKeyMissing, setPriceKeyMissing] = useState(false);

  const activeGoal = goals.find((goal) => goal.id === activeGoalId) ?? goals[0] ?? null;
  const priceSources = usePriceNodeStore((state) => (activeGoal ? state.byGoalId[activeGoal.id]?.sources ?? [] : []));
  const contract = activeGoal ? contracts[activeGoal.id] ?? null : null;

  const progress = activeGoal ? calculateGoalProgress(activeGoal) : 0;
  const forecast = activeGoal ? calculateForecastDate(activeGoal, transactions) : null;
  const averageDeposit = activeGoal ? calculateAverageDeposit(transactions, activeGoal.id) : 0;
  const remainingAmount = activeGoal ? calculateRemainingAmount(activeGoal) : 0;
  const showVictory = Boolean(activeGoal && progress >= 1);

  const accent = activeGoal?.type === 'monitor' ? baseColors.purple : baseColors.cyan;
  const drift = activeGoal ? calculatePaceDrift(activeGoal, transactions) : { expectedNow: 0, delta: 0 };
  const driftBehind = drift.delta < 0;
  const bestNow = useMemo(() => {
    const values = priceSources.map((source) => source.last?.priceUAH ?? null).filter((v): v is number => typeof v === 'number');
    return values.length ? Math.min(...values) : null;
  }, [priceSources]);

  const lowest30d = useMemo(() => {
    const values = priceSources.flatMap((source) => source.history30d.map((p) => p.priceUAH));
    return values.length ? Math.min(...values) : null;
  }, [priceSources]);

  const isStale = useMemo(() => {
    const lastTimes = priceSources.map((source) => (source.last?.fetchedAt ? Date.parse(source.last.fetchedAt) : 0)).filter((t) => t > 0);
    if (lastTimes.length === 0) {
      return true;
    }
    const newest = Math.max(...lastTimes);
    return Date.now() - newest > 12 * 60 * 60 * 1000;
  }, [priceSources]);

  const todayKey = toDateKey(new Date().toISOString());
  const lastDepositKey = activeGoal?.lastDepositDate ? toDateKey(activeGoal.lastDepositDate) : null;
  const hardcoreRisk = Boolean(activeGoal && contract?.tier === 'hardcore' && lastDepositKey !== todayKey);

  const graceLeft = useMemo(() => {
    if (!contract || contract.tier !== 'safe') {
      return 0;
    }
    return Math.max(contract.gracePerWeek - contract.graceUsedDateKeys.length, 0);
  }, [contract]);

  const currentMilestoneIndex = useMemo(() => {
    const pct = Math.round(progress * 100);
    return milestoneThresholds.filter((t) => pct >= t).length;
  }, [progress]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getMidnightCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeGoal) {
      return;
    }
    ensureSeededPrice(activeGoal);
  }, [activeGoal, ensureSeededPrice]);

  useEffect(() => {
    if (priceFetchMode === 'free') {
      setPriceKeyMissing(false);
      return;
    }

    let mounted = true;
    const check = async () => {
      const key = await getZenRowsApiKey();
      if (!mounted) {
        return;
      }
      setPriceKeyMissing(!key);
    };
    void check();
    return () => {
      mounted = false;
    };
  }, [priceFetchMode]);
  useEffect(() => {
    if (!activeGoal) {
      return;
    }

    const seen = milestonesSeen[activeGoal.id] ?? 0;
    if (currentMilestoneIndex > seen) {
      const label = milestoneThresholds[currentMilestoneIndex - 1] ?? 0;
      setMilestoneToast(`MILESTONE ${label}% UNLOCKED`);
      markMilestoneSeen(activeGoal.id, currentMilestoneIndex);
      void Promise.all([triggerLightHaptic(), playUnlockSound()]);
      const timeout = setTimeout(() => setMilestoneToast(''), 1400);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [activeGoal, currentMilestoneIndex, markMilestoneSeen, milestonesSeen]);

  const handleDeposit = async (amount: number) => {
    if (!activeGoal) {
      await triggerLightHaptic();
      router.push('/(screens)/screen_02_goal_config');
      return;
    }

    setParticleAmount(amount);
    setLastQuickDepositAmount(amount);
    addTransaction({
      goalId: activeGoal.id,
      amount,
      date: new Date().toISOString(),
      comment: `Quick deposit +${amount}`,
      mood: null,
    });
    await Promise.all([triggerMediumHaptic(), playCoinDropSound()]);
  };

  return (
    <View style={styles.screen}>
      <DigitalRain opacity={0.08} tint={accent} />

      {milestoneToast ? (
        <View pointerEvents="none" style={styles.toast}>
          <GlitchText text={milestoneToast} style={styles.toastText} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>MISSION CONTROL</Text>
            <GlitchText text="DASHBOARD" style={styles.title} />
          </View>
          {activeGoal ? (
            <View style={[styles.statusPill, { borderColor: `${accent}66` }]}>
              <Text style={[styles.statusText, { color: accent }]}>{(contract?.tier ?? activeGoal.mode).toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        {!activeGoal ? (
          <CyberpunkCard onPress={() => router.push('/(screens)/screen_02_goal_config')}>
            <Text style={styles.emptyTitle}>Створити першу ціль</Text>
            <Text style={styles.emptySubtitle}>Activate your first mission target to start tracking progress.</Text>
          </CyberpunkCard>
        ) : (
          <>
            {hardcoreRisk ? (
              <CyberpunkCard borderColor={baseColors.warning}>
                <Text style={styles.warningTitle}>STREAK AT RISK</Text>
                <Text style={styles.warningText}>Deposit before midnight to avoid System Failure.</Text>
                <Text style={styles.warningText}>Time left: {countdown}</Text>
                <Text style={styles.warningText}>Shields: {contract?.shields ?? 0}</Text>
              </CyberpunkCard>
            ) : null}

            {contract?.tier === 'safe' ? (
              <CyberpunkCard>
                <Text style={styles.warningTitle}>SAFE CONTRACT</Text>
                <Text style={styles.warningText}>Grace left this week: {graceLeft}</Text>
                <Text style={styles.warningText}>Shields: {contract?.shields ?? 0}</Text>
              </CyberpunkCard>
            ) : null}

            {showVictory ? (
              <CyberpunkCard borderColor={baseColors.green} onPress={() => router.push({ pathname: '/(screens)/screen_10_victory', params: { goalId: activeGoal.id } })}>
                <Text style={styles.warningTitle}>Victory banner unlocked</Text>
                <Text style={styles.warningText}>Your goal reached 100%. Tap to enter the victory screen.</Text>
              </CyberpunkCard>
            ) : null}

            <CyberpunkCard onPress={() => router.push({ pathname: '/(screens)/screen_21_goal_detail', params: { id: activeGoal.id } })}>
              <View style={styles.heroBackdrop}>
                <ImageBackground 
                  source={require('../../assets/images/victory-setup.jpg')} 
                  style={styles.heroImage}
                  resizeMode="cover"
                >
                  <View style={styles.heroImageOverlay} />
                </ImageBackground>
                <View style={[styles.heroGlow, { backgroundColor: `${accent}18` }]} />
                <View style={styles.heroRow}>
                  <ProgressRing color={accent} progress={progress} size={188}>
                    <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
                    <Text style={styles.progressCaption}>SYNC</Text>
                  </ProgressRing>
                  <HologramProduct goalType={activeGoal.type} progress={progress} size={148} />
                </View>
              </View>
              <Text style={styles.goalName}>{activeGoal.name}</Text>
              <Text style={styles.goalAmount}>
                {formatCurrencyPrivacy(activeGoal.currentAmount, currency, privacyMode)} / {formatCurrencyPrivacy(activeGoal.targetAmount, currency, privacyMode)}
              </Text>

              <View style={styles.metricGrid}>
                <View style={styles.metricCell}>
                  <Text style={styles.metricLabel}>Remaining</Text>
                  <Text style={styles.metricValue}>{formatCurrencyPrivacy(remainingAmount, currency, privacyMode)}</Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={styles.metricLabel}>Streak</Text>
                  <Text style={styles.metricValue}>{activeGoal.dailyStreak} days</Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={styles.metricLabel}>Avg deposit</Text>
                  <Text style={styles.metricValue}>{formatCurrencyPrivacy(averageDeposit, currency, privacyMode)}</Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={styles.metricLabel}>Forecast</Text>
                  <Text style={styles.metricValue}>{forecast ? forecast.slice(5, 10) : 'No data'}</Text>
                </View>
              </View>

              <View style={styles.driftShell}>
                <Text style={styles.metricLabel}>Auto-Pace Drift</Text>
                <View style={styles.driftBar}>
                  <View
                    style={[
                      styles.driftFill,
                      {
                        width: `${Math.max(8, Math.min(100, Math.round((activeGoal.currentAmount / Math.max(drift.expectedNow, 1)) * 100)))}%`,
                        backgroundColor: driftBehind ? baseColors.warning : baseColors.green,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.driftText, { color: driftBehind ? baseColors.warning : baseColors.green }]}>
                  {driftBehind ? 'BEHIND' : 'AHEAD'}: {formatCurrencyPrivacy(Math.abs(drift.delta), currency, privacyMode)}
                </Text>
              </View>
              <View style={styles.priceShell}>
                <View style={styles.priceHeader}>
                  <Text style={styles.metricLabel}>PRICE NODE</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/(screens)/screen_21_goal_detail', params: { id: activeGoal.id } })}
                    style={({ pressed }) => [styles.priceLink, pressed && styles.priceLinkPressed]}
                  >
                    <Text style={styles.priceLinkText}>OPEN</Text>
                  </Pressable>
                </View>

                {priceFetchMode !== 'free' && priceKeyMissing ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/(screens)/screen_34_comms',
                        params: { openKeyVault: '1', vault: 'price' },
                      })
                    }
                  >
                    <Text style={styles.priceWarn}>⚠️ PRICE NODE: OFFLINE. Відкрий KEY VAULT</Text>
                  </Pressable>
                ) : null}

                <View style={styles.priceGrid}>
                  <View style={styles.priceCell}>
                    <Text style={styles.metricLabel}>BEST NOW</Text>
                    <Text style={styles.metricValue}>
                      {bestNow === null
                        ? '—'
                        : formatCurrencyPrivacy(bestNow, 'UAH', privacyMode)}
                    </Text>
                  </View>
                  <View style={styles.priceCell}>
                    <Text style={styles.metricLabel}>LOWEST 30D</Text>
                    <Text style={styles.metricValue}>
                      {lowest30d === null
                        ? '—'
                        : formatCurrencyPrivacy(lowest30d, 'UAH', privacyMode)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.priceMeta}>{isStale ? 'STALE SIGNAL' : 'LIVE SIGNAL'} • SOURCES: {priceSources.length}</Text>
              </View>

              {activeGoal.mode === 'auto' && activeGoal.recommendedDailyAmount ? (
                <Text style={styles.autoMode}>Auto pace: {formatCurrencyPrivacy(activeGoal.recommendedDailyAmount, currency, privacyMode)} / day</Text>
              ) : null}
            </CyberpunkCard>

            <View style={styles.depositHeader}>
              <Text style={styles.depositTitle}>INSTANT CREDIT</Text>
              <Text style={styles.depositSubtitle}>Tap to push the mission meter forward.</Text>
            </View>
            <View style={styles.inlineRow}>
              {[50, 100, 500].map((amount) => (
                <View key={amount} style={styles.inlineItem}>
                  <NeonButton label={`+${amount}`} onPress={() => void handleDeposit(amount)} />
                  <CoinParticle trigger={particleAmount === amount} onComplete={() => setParticleAmount(null)} />
                </View>
              ))}
            </View>

            <View style={styles.actionStack}>
              <NeonButton label="Custom Amount" onPress={() => router.push({ pathname: '/(screens)/screen_04_add_deposit', params: { goalId: activeGoal.id } })} />
              <NeonButton label="Quick Deposit Screen" onPress={() => router.push({ pathname: '/(screens)/screen_24_quick_deposit', params: { goalId: activeGoal.id } })} />
              <NeonButton label="Dual Goal View" onPress={() => router.push('/(screens)/screen_09_dual_goal')} />
              <NeonButton label="Risk Simulator" onPress={() => router.push('/(screens)/screen_31_risk_simulator')} />
            </View>
          </>
        )}
      </ScrollView>
      <CommsFloatingPing />
      <BottomNavBar currentIndex={0} onPress={(index) => router.push(bottomNavRoutes[index])} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 16, paddingTop: 56, gap: 12 },
  content: { gap: 18, paddingBottom: 20 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 56,
    zIndex: 20,
    alignItems: 'center',
  },
  toastText: { fontSize: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { gap: 4 },
  kicker: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, letterSpacing: 2.2, fontSize: 12 },
  title: { color: baseColors.textPrimary, fontSize: 30, letterSpacing: 2 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statusText: { fontFamily: fontFamilies.accentBold, fontSize: 12, letterSpacing: 1.8 },
  emptyTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  emptySubtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  heroBackdrop: { marginBottom: 16, overflow: 'hidden', borderRadius: 24, position: 'relative' },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.82)',
  },
  heroGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  progressValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28 },
  progressCaption: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, fontSize: 11, letterSpacing: 1.7, marginTop: 2 },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 22, marginBottom: 8 },
  goalAmount: { color: baseColors.cyan, fontFamily: fontFamilies.accentBold, fontSize: 18, marginBottom: 10 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCell: {
    width: '47%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    gap: 6,
  },
  metricLabel: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, fontSize: 11, letterSpacing: 1.5 },
  metricValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, fontSize: 14 },
  driftShell: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 8,
  },
  driftBar: { height: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  driftFill: { height: '100%', borderRadius: 999 },
  driftText: { fontFamily: fontFamilies.accentBold, letterSpacing: 1.4 },
  autoMode: { color: baseColors.green, fontFamily: fontFamilies.accentBold, marginTop: 10 },
  depositHeader: { gap: 4 },
  priceShell: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 10,
  },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLink: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(10,10,15,0.6)',
  },
  priceLinkPressed: { opacity: 0.9 },
  priceLinkText: { color: baseColors.textPrimary, fontFamily: fontFamilies.accentBold, letterSpacing: 1.6, fontSize: 11 },
  priceWarn: { color: baseColors.warning, fontFamily: fontFamilies.body, lineHeight: 20 },
  priceGrid: { flexDirection: 'row', gap: 10 },
  priceCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    backgroundColor: 'rgba(10,10,15,0.35)',
    padding: 10,
    gap: 6,
  },
  priceMeta: { color: baseColors.textMuted, fontFamily: fontFamilies.accent, fontSize: 10, letterSpacing: 1.3 },
  depositTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, letterSpacing: 1.3 },
  depositSubtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, fontSize: 14 },
  inlineRow: { flexDirection: 'row', gap: 10 },
  inlineItem: { flex: 1, minHeight: 56, position: 'relative' },
  actionStack: { gap: 10 },
  warningTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 6 },
  warningText: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
});







