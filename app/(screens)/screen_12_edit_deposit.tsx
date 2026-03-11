import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import { useTransactionsStore } from '@/store/transactionsStore';
import { baseColors, fontFamilies } from '@/theme';

export default function Screen12EditDeposit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactions = useTransactionsStore((state) => state.transactions);
  const updateTransaction = useTransactionsStore((state) => state.updateTransaction);
  const transaction = transactions.find((item) => item.id === id) ?? transactions[0] ?? null;
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [comment, setComment] = useState(transaction?.comment ?? '');

  const error = useMemo(() => {
    const numeric = Number(amount);
    if (!transaction) {
      return 'No transaction selected';
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return 'Amount must be greater than zero';
    }
    return '';
  }, [amount, transaction]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>EDIT DEPOSIT</Text>
      <CyberpunkCard>
        <Text style={styles.label}>Amount</Text>
        <TextInput keyboardType="numeric" onChangeText={setAmount} style={styles.input} value={amount} />
        <Text style={styles.label}>Comment</Text>
        <TextInput onChangeText={setComment} style={[styles.input, styles.comment]} value={comment} />
      </CyberpunkCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <NeonButton
        label="Save Deposit"
        onPress={() => {
          if (!transaction || error) {
            return;
          }
          updateTransaction(transaction.id, { amount: Number(amount), comment: comment.trim() });
          router.back();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  label: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 10, textTransform: 'uppercase' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.78)' },
  comment: { minHeight: 88, textAlignVertical: 'top', paddingTop: 14 },
  error: { color: baseColors.danger, fontFamily: fontFamilies.bodyMedium },
});
