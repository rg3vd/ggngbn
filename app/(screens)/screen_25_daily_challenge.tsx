import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import { dailyChallenges } from '@/constants';
import { playSuccessChimeSound, triggerMediumHaptic } from '@/services';
import { useChallengeStore } from '@/store/challengeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy, toDateKey } from '@/utils';

const getCountdown = (): string => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function Screen25DailyChallenge() {
  const [countdown, setCountdown] = useState(getCountdown());
  const challenges = useChallengeStore((state) => state.challenges);
  const ensureChallengeForDate = useChallengeStore((state) => state.ensureChallengeForDate);
  const completeChallenge = useChallengeStore((state) => state.completeChallenge);
  const transactions = useTransactionsStore((state) => state.transactions);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    ensureChallengeForDate(todayKey);
  }, [ensureChallengeForDate, todayKey]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  const challenge = useMemo(() => challenges.find((item) => item.dateKey === todayKey) ?? null, [challenges, todayKey]);
  const challengeText = challenge ? dailyChallenges[challenge.challengeIndex]?.text ?? 'Add any deposit today.' : 'Loading mission...';
  const history = challenges.slice(-7).reverse();
  const todayTransactions = useMemo(() => transactions.filter((item) => toDateKey(item.date) === todayKey), [todayKey, transactions]);
  const yesterdayKey = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const yesterdayAmount = useMemo(() => transactions.filter((item) => toDateKey(item.date) === yesterdayKey).reduce((sum, item) => sum + item.amount, 0), [transactions, yesterdayKey]);
  const todayAmount = todayTransactions.reduce((sum, item) => sum + item.amount, 0);
  const progressHint = useMemo(() => {
    if (!challenge) {
      return { percent: 0, hint: 'Generating mission telemetry...' };
    }

    switch (challenge.challengeIndex) {
      case 0:
        return { percent: Math.min(todayTransactions.length * 100, 100), hint: 'Any deposit unlocks today\'s mission.' };
      case 1:
        return { percent: Math.min((todayTransactions.length / 2) * 100, 100), hint: 'Two deposits are required for this run.' };
      case 2:
        return { percent: yesterdayAmount > 0 ? Math.min((todayAmount / yesterdayAmount) * 100, 100) : Math.min(todayAmount, 100), hint: 'Beat yesterday\'s total to complete the mission.' };
      case 3:
        return { percent: todayTransactions.some((item) => item.mood) ? 100 : 0, hint: 'A mood-tagged deposit clears this mission instantly.' };
      case 4:
        return { percent: Math.min((todayAmount / 150) * 100, 100), hint: '150 UAH is the target threshold today.' };
      case 5:
        return { percent: todayTransactions.length > 0 ? 100 : 0, hint: 'Fast open-window tracking is device-side; any quick deposit is treated as success here.' };
      case 6:
        return { percent: todayTransactions.some((item) => item.comment.trim().length > 10) ? 100 : 0, hint: 'A comment longer than 10 chars completes it.' };
      case 7:
        return { percent: todayTransactions.length > 0 ? 100 : 0, hint: 'Progress barrier tracking follows your goal progress after today\'s deposit.' };
      default:
        return { percent: 0, hint: 'Mission telemetry unavailable.' };
    }
  }, [challenge, todayAmount, todayTransactions, yesterdayAmount]);
  const completedStreak = useMemo(() => history.reduce((run, item) => (item.completed ? run + 1 : run), 0), [history]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>DAILY CHALLENGE</Text>
      <CyberpunkCard>
        <Text style={styles.challenge}>{challengeText}</Text>
        <Text style={styles.countdown}>Reset in {countdown}</Text>
        <Text style={styles.meta}>{challenge?.completed ? 'Completed' : 'Pending'}</Text>
        <View style={styles.progressShell}>
          <View style={[styles.progressFill, { width: `${Math.max(8, Math.min(progressHint.percent, 100))}%` }]} />
        </View>
        <Text style={styles.hint}>{progressHint.hint}</Text>
      </CyberpunkCard>
      {challenge && !challenge.completed ? <NeonButton label="Complete Challenge" onPress={() => { completeChallenge(challenge.id); void Promise.all([triggerMediumHaptic(), playSuccessChimeSound()]); }} /> : null}
      <CyberpunkCard>
        <Text style={styles.sectionTitle}>Mission intel</Text>
        <Text style={styles.meta}>Deposits today: {todayTransactions.length}</Text>
        <Text style={styles.meta}>Amount today: {formatCurrencyPrivacy(todayAmount, currency, privacyMode)}</Text>
        <Text style={styles.meta}>Completed in last 7 days: {completedStreak}</Text>
      </CyberpunkCard>
      <CyberpunkCard>
        <Text style={styles.sectionTitle}>Last 7 missions</Text>
        {history.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <Text style={styles.meta}>{item.dateKey}</Text>
            <Text style={[styles.status, item.completed ? styles.statusDone : styles.statusPending]}>{item.completed ? 'Completed' : 'Pending'}</Text>
          </View>
        ))}
      </CyberpunkCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  challenge: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 22, marginBottom: 8 },
  countdown: { color: baseColors.pink, fontFamily: fontFamilies.accentBold, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, marginBottom: 6 },
  sectionTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  progressShell: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginVertical: 10 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: baseColors.green },
  hint: { color: baseColors.warning, fontFamily: fontFamilies.bodyMedium, lineHeight: 22 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  status: { fontFamily: fontFamilies.accentBold, letterSpacing: 1.2 },
  statusDone: { color: baseColors.green },
  statusPending: { color: baseColors.warning },
});
