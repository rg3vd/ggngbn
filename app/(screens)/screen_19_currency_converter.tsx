import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonChip from '@/components/NeonChip';
import { fetchCurrencyRates, playButtonTapSound, triggerLightHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { CurrencyCode } from '@/types';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy } from '@/utils';

const currencies: CurrencyCode[] = ['UAH', 'USD', 'EUR'];

export default function Screen19CurrencyConverter() {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState<CurrencyCode>('UAH');
  const [to, setTo] = useState<CurrencyCode>('USD');
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ UAH: 1, USD: 0.024, EUR: 0.022 });
  const [source, setSource] = useState<'remote' | 'cache'>('cache');
  const [loading, setLoading] = useState(true);

  const goals = useGoalsStore((state) => state.goals.filter((goal) => !goal.archived));
  const setRatesLastUpdated = useSettingsStore((state) => state.setRatesLastUpdated);
  const ratesLastUpdated = useSettingsStore((state) => state.ratesLastUpdated);
  const activeGoalId = useSettingsStore((state) => state.activeGoalId);

  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const activeGoal = goals.find((goal) => goal.id === activeGoalId) ?? goals[0] ?? null;

  useEffect(() => {
    let mounted = true;

    fetchCurrencyRates()
      .then((cache) => {
        if (!mounted) {
          return;
        }
        setRates(cache.rates);
        setSource(cache.source);
        setRatesLastUpdated(cache.fetchedAt);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [setRatesLastUpdated]);

  const result = useMemo(() => {
    const numeric = Number(amount) || 0;
    const inUah = numeric / (rates[from] || 1);
    return inUah * (rates[to] || 1);
  }, [amount, from, rates, to]);

  const remaining = activeGoal ? Math.max(activeGoal.targetAmount - activeGoal.currentAmount, 0) : 0;
  const quickRate = useMemo(() => ((rates[to] || 1) / (rates[from] || 1)).toFixed(4), [from, rates, to]);

  const rateLine = privacyMode === 'blackout' ? 'BLACKOUT: RATE HIDDEN' : `1 ${from} = ${quickRate} ${to}`;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>CURRENCY CONVERTER</Text>
      <CyberpunkCard>
        <Text style={styles.label}>Amount</Text>
        <TextInput keyboardType="numeric" onChangeText={setAmount} style={styles.input} value={amount} />
        <Text style={styles.result}>{formatCurrencyPrivacy(result, to, privacyMode)}</Text>
        <Text style={styles.source}>{loading ? 'Loading rates...' : source === 'remote' ? 'Live NBU rates' : 'Offline cached rates'}</Text>
        <Text style={styles.meta}>{rateLine}</Text>
        <Text style={styles.meta}>Updated: {ratesLastUpdated ? ratesLastUpdated.slice(0, 16).replace('T', ' ') : 'unknown'}</Text>
      </CyberpunkCard>
      <View style={styles.rowWrap}>
        {currencies.map((currency) => (
          <NeonChip key={`from-${currency}`} label={`FROM ${currency}`} isSelected={from === currency} onPress={() => setFrom(currency)} />
        ))}
      </View>
      <NeonChip
        label="SWAP"
        isSelected={false}
        onPress={() => {
          const nextFrom = to;
          setTo(from);
          setFrom(nextFrom);
          void Promise.all([triggerLightHaptic(), playButtonTapSound()]);
        }}
      />
      <View style={styles.rowWrap}>
        {currencies.map((currency) => (
          <NeonChip key={`to-${currency}`} label={`TO ${currency}`} isSelected={to === currency} onPress={() => setTo(currency)} />
        ))}
      </View>
      <View style={styles.rowWrap}>
        <NeonChip label="Goal Target" isSelected={false} onPress={() => activeGoal && setAmount(String(activeGoal.targetAmount))} />
        <NeonChip label="Accumulated" isSelected={false} onPress={() => activeGoal && setAmount(String(activeGoal.currentAmount))} />
        <NeonChip label="Remaining" isSelected={false} onPress={() => setAmount(String(remaining))} />
      </View>
      <CyberpunkCard>
        <Text style={styles.label}>Goal-side quick convert</Text>
        {goals.slice(0, 3).map((goal) => {
          const target = (goal.targetAmount / rates.UAH) * rates[to];
          const current = (goal.currentAmount / rates.UAH) * rates[to];
          const left = ((goal.targetAmount - goal.currentAmount) / rates.UAH) * rates[to];
          return (
            <View key={goal.id} style={styles.goalRow}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.quick}>Target: {formatCurrencyPrivacy(target, to, privacyMode)}</Text>
              <Text style={styles.quick}>Current: {formatCurrencyPrivacy(current, to, privacyMode)}</Text>
              <Text style={styles.quick}>Remaining: {formatCurrencyPrivacy(Math.max(left, 0), to, privacyMode)}</Text>
            </View>
          );
        })}
      </CyberpunkCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  result: { color: baseColors.cyan, fontFamily: fontFamilies.headingBold, fontSize: 26 },
  rowWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  quick: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, marginBottom: 4 },
  source: { color: baseColors.warning, fontFamily: fontFamilies.bodyMedium, marginTop: 8 },
  meta: { color: baseColors.textMuted, fontFamily: fontFamilies.body, marginTop: 6 },
  goalRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, marginBottom: 6 },
});