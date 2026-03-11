import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';

import CyberpunkCard from '@/components/CyberpunkCard';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { accentColorMap, baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy, hexToRgba, toDateKey } from '@/utils';

const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Screen13Calendar() {
  const params = useLocalSearchParams<{ goalId?: string }>();

  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const transactions = useTransactionsStore((state) => state.transactions);
  const goals = useGoalsStore((state) => state.goals);

  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);
  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const accent = accentColorMap[activeTheme];

  const goal = useMemo(() => {
    if (!params.goalId) {
      return null;
    }
    return goals.find((g) => g.id === params.goalId) ?? null;
  }, [goals, params.goalId]);

  const scopedTransactions = useMemo(() => {
    if (!params.goalId) {
      return transactions;
    }
    return transactions.filter((item) => item.goalId === params.goalId);
  }, [params.goalId, transactions]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 }),
    });
  }, [monthCursor]);

  const monthTransactions = useMemo(
    () => scopedTransactions.filter((item) => format(new Date(item.date), 'yyyy-MM') === format(monthCursor, 'yyyy-MM')),
    [monthCursor, scopedTransactions]
  );

  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      const key = toDateKey(t.date);
      totals[key] = (totals[key] ?? 0) + t.amount;
    });
    return totals;
  }, [monthTransactions]);

  const maxDayTotal = useMemo(() => {
    const values = Object.values(dayTotals);
    return values.length === 0 ? 0 : Math.max(...values);
  }, [dayTotals]);

  const selectedTransactions = useMemo(
    () => scopedTransactions.filter((item) => toDateKey(item.date) === selectedKey),
    [selectedKey, scopedTransactions]
  );

  const selectedTotal = selectedTransactions.reduce((sum, item) => sum + item.amount, 0);
  const monthTotal = monthTransactions.reduce((sum, item) => sum + item.amount, 0);
  const monthDepositDays = new Set(monthTransactions.map((item) => toDateKey(item.date))).size;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>CALENDAR</Text>
      {goal ? <Text style={styles.subtitle}>GOAL: {goal.name}</Text> : null}

      <View style={styles.headerRow}>
        <Pressable onPress={() => setMonthCursor((value) => subMonths(value, 1))}>
          <Text style={[styles.arrow, { color: accent }]}>←</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{format(monthCursor, 'LLLL yyyy')}</Text>
        <Pressable onPress={() => setMonthCursor((value) => addMonths(value, 1))}>
          <Text style={[styles.arrow, { color: accent }]}>→</Text>
        </Pressable>
      </View>

      <CyberpunkCard>
        <Text style={styles.sectionTitle}>Month telemetry</Text>
        <Text style={styles.meta}>Deposit days: {monthDepositDays}</Text>
        <Text style={styles.meta}>Deposits amount: {formatCurrencyPrivacy(monthTotal, currency, privacyMode)}</Text>
        <View style={styles.legendRow}>
          {[0.1, 0.25, 0.5, 0.9].map((p) => (
            <View key={p} style={[styles.legendChip, { backgroundColor: hexToRgba(accent, 0.06 + p * 0.22) }]} />
          ))}
          <Text style={styles.legendText}>Signal Strength</Text>
        </View>
      </CyberpunkCard>

      <CyberpunkCard>
        <View style={styles.weekRow}>
          {weekLabels.map((label) => (
            <Text key={label} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const outsideMonth = format(day, 'yyyy-MM') !== format(monthCursor, 'yyyy-MM');
            const total = dayTotals[key] ?? 0;
            const intensity = maxDayTotal > 0 ? Math.min(1, total / maxDayTotal) : 0;
            const selected = selectedKey === key;
            const bg = intensity > 0 ? hexToRgba(accent, 0.06 + intensity * 0.22) : 'rgba(10,10,15,0.65)';

            return (
              <Pressable
                key={key}
                onPress={() => setSelectedKey(key)}
                style={[
                  styles.dayCell,
                  { backgroundColor: bg, borderColor: intensity > 0 ? hexToRgba(accent, 0.5) : 'rgba(255,255,255,0.06)' },
                  selected && styles.daySelected,
                  outsideMonth && styles.dayOutside,
                ]}
              >
                <Text style={[styles.dayText, intensity > 0 && { color: accent }, isToday(day) && styles.todayText]}>
                  {format(day, 'd')}
                </Text>
                {intensity > 0 ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
              </Pressable>
            );
          })}
        </View>
      </CyberpunkCard>

      {selectedKey ? (
        <CyberpunkCard>
          <Text style={styles.sectionTitle}>Transactions on {selectedKey}</Text>
          <Text style={styles.meta}>Total: {formatCurrencyPrivacy(selectedTotal, currency, privacyMode)}</Text>
          {selectedTransactions.length === 0 ? <Text style={styles.meta}>No deposits on this day.</Text> : null}
          {selectedTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <Text style={styles.transactionAmount}>{formatCurrencyPrivacy(transaction.amount, currency, privacyMode)}</Text>
              <Text style={styles.transactionMeta}>
                {transaction.comment || 'Quick deposit'}
                {transaction.mood ? ` • ${transaction.mood}` : ''}
              </Text>
            </View>
          ))}
        </CyberpunkCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.bodyMedium, marginTop: -8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { fontFamily: fontFamilies.headingBold, fontSize: 24 },
  monthLabel: { color: baseColors.textPrimary, fontFamily: fontFamilies.accentBold, fontSize: 18 },
  sectionTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  legendChip: { width: 18, height: 10, borderRadius: 999 },
  legendText: { color: baseColors.textMuted, fontFamily: fontFamilies.bodyMedium },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekLabel: { width: '13%', color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, textAlign: 'center', fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  daySelected: { borderColor: baseColors.pink, borderWidth: 2 },
  dayOutside: { opacity: 0.28 },
  dayText: { color: baseColors.textSecondary, fontFamily: fontFamilies.bodyMedium },
  todayText: { color: baseColors.warning },
  dot: { width: 5, height: 5, borderRadius: 999, marginTop: 3 },
  transactionRow: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  transactionAmount: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, marginBottom: 4 },
  transactionMeta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
});