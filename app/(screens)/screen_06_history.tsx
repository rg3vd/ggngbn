import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import BottomNavBar from '@/components/BottomNavBar';
import CommsFloatingPing from '@/components/CommsFloatingPing';
import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import { bottomNavRoutes } from '@/constants';
import { exportSummaryPdf, exportTransactionsCsv, playButtonTapSound, triggerLightHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';
import { formatCurrencyPrivacy, formatDisplayDate } from '@/utils';

export default function Screen06History() {
  const transactions = useTransactionsStore((state) => state.transactions);
  const deleteTransaction = useTransactionsStore((state) => state.deleteTransaction);
  const goals = useGoalsStore((state) => state.goals);

  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>HISTORY</Text>
        <View style={styles.exportRow}>
          <NeonButton label="Export CSV" onPress={() => void exportTransactionsCsv(transactions)} />
          <NeonButton label="Export PDF" onPress={() => void exportSummaryPdf(goals, transactions)} />
        </View>
        {transactions.map((transaction) => {
          const goal = goals.find((item) => item.id === transaction.goalId);
          return (
            <CyberpunkCard key={transaction.id}>
              <Text style={styles.amount}>{formatCurrencyPrivacy(transaction.amount, currency, privacyMode)}</Text>
              <Text style={styles.comment}>{transaction.comment || 'Quick deposit'}</Text>
              <Text style={styles.meta}>
                {goal?.name ?? 'Unknown goal'} • {formatDisplayDate(transaction.date)}
              </Text>
              <View style={styles.actions}>
                <NeonButton
                  label="Edit"
                  onPress={() => {
                    void triggerLightHaptic();
                    router.push({ pathname: '/(screens)/screen_12_edit_deposit', params: { id: transaction.id } });
                  }}
                />
                <NeonButton
                  label="Delete"
                  onPress={() => {
                    deleteTransaction(transaction.id);
                    void playButtonTapSound();
                  }}
                />
              </View>
            </CyberpunkCard>
          );
        })}
        {transactions.length === 0 ? <Text style={styles.empty}>No transactions yet.</Text> : null}
      </ScrollView>
      <CommsFloatingPing />
      <BottomNavBar currentIndex={2} onPress={(index) => router.push(bottomNavRoutes[index])} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.background,
    padding: 16,
    paddingTop: 56,
    gap: 12,
  },
  content: {
    gap: 14,
    paddingBottom: 20,
  },
  title: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    letterSpacing: 2,
  },
  amount: {
    color: baseColors.cyan,
    fontFamily: fontFamilies.headingBold,
    fontSize: 20,
    marginBottom: 6,
  },
  comment: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.body,
    marginBottom: 4,
  },
  meta: {
    color: baseColors.textSecondary,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    marginBottom: 12,
  },
  empty: {
    color: baseColors.textSecondary,
    fontFamily: fontFamilies.body,
    marginTop: 10,
  },
  actions: {
    gap: 10,
  },
  exportRow: {
    gap: 10,
  },
});