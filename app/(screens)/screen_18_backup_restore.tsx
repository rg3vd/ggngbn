import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import { exportJsonBackup, playAlertSound, playSuccessChimeSound, playUnlockSound, readBackupFile, triggerLightHaptic, triggerMediumHaptic } from '@/services';
import { useGoalsStore } from '@/store/goalsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { Goal, Transaction } from '@/types';
import { baseColors, fontFamilies } from '@/theme';

interface BackupPreview {
  goals: Goal[];
  transactions: Transaction[];
  sourceName: string;
}

export default function Screen18BackupRestore() {
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const goals = useGoalsStore((state) => state.goals);
  const transactions = useTransactionsStore((state) => state.transactions);
  const replaceGoals = useGoalsStore((state) => state.replaceGoals);
  const replaceTransactions = useTransactionsStore((state) => state.replaceTransactions);

  const snapshot = useMemo(() => ({
    activeGoals: goals.filter((goal) => !goal.archived).length,
    archivedGoals: goals.filter((goal) => goal.archived).length,
    transactions: transactions.length,
  }), [goals, transactions]);

  const exportData = async () => {
    try {
      setBusy(true);
      await exportJsonBackup({ goals, transactions });
      await Promise.all([triggerLightHaptic(), playSuccessChimeSound()]);
      setMessage('Backup exported successfully. Share sheet opened.');
    } catch {
      await playAlertSound();
      setMessage('Export failed. This device refused to create the backup file.');
    } finally {
      setBusy(false);
    }
  };

  const pickImportData = async () => {
    try {
      setBusy(true);
      const file = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (file.canceled) {
        setMessage('Import canceled before a file was selected.');
        return;
      }

      const asset = file.assets[0];
      const payload = await readBackupFile(asset?.uri ?? '');
      setPreview({ goals: payload.goals, transactions: payload.transactions, sourceName: asset?.name ?? 'backup.json' });
      await Promise.all([triggerLightHaptic(), playUnlockSound()]);
      setMessage(`Preview ready: ${payload.goals.length} goals, ${payload.transactions.length} transactions.`);
    } catch {
      await playAlertSound();
      Alert.alert('Import failed', 'Backup file is invalid or unreadable.');
    } finally {
      setBusy(false);
    }
  };

  const applyImportPreview = () => {
    if (!preview) {
      return;
    }

    Alert.alert('Overwrite local data?', 'This will replace the current goals and transactions with the previewed backup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Apply backup',
        style: 'destructive',
        onPress: async () => {
          replaceGoals(preview.goals);
          replaceTransactions(preview.transactions);
          setPreview(null);
          await Promise.all([triggerMediumHaptic(), playSuccessChimeSound()]);
          setMessage('Backup restored successfully. Local storage has been replaced.');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>BACKUP & RESTORE</Text>
      <CyberpunkCard>
        <Text style={styles.sectionTitle}>Current vault snapshot</Text>
        <Text style={styles.body}>Active goals: {snapshot.activeGoals}</Text>
        <Text style={styles.body}>Archived goals: {snapshot.archivedGoals}</Text>
        <Text style={styles.body}>Transactions: {snapshot.transactions}</Text>
      </CyberpunkCard>
      <CyberpunkCard>
        <Text style={styles.sectionTitle}>Export</Text>
        <Text style={styles.body}>Save a portable JSON image of your vault before risky changes, reinstalling, or moving devices.</Text>
      </CyberpunkCard>
      <NeonButton isLoading={busy} label="Export Backup" onPress={() => void exportData()} />
      <CyberpunkCard>
        <Text style={styles.sectionTitle}>Import</Text>
        <Text style={styles.body}>Pick a backup file, inspect the preview, then explicitly confirm replacement of the current local vault.</Text>
      </CyberpunkCard>
      <NeonButton isLoading={busy} label="Pick Backup File" onPress={() => void pickImportData()} />
      {preview ? (
        <CyberpunkCard borderColor={baseColors.warning}>
          <Text style={styles.sectionTitle}>Preview: {preview.sourceName}</Text>
          <Text style={styles.body}>Goals inside: {preview.goals.length}</Text>
          <Text style={styles.body}>Transactions inside: {preview.transactions.length}</Text>
          <Text style={styles.body}>Targets: {preview.goals.slice(0, 3).map((goal) => goal.name).join(', ') || 'No goals in file'}</Text>
          <Text style={styles.warning}>Applying this backup will overwrite the current local vault snapshot.</Text>
          <NeonButton label="Apply Previewed Backup" onPress={applyImportPreview} color={baseColors.warning} />
        </CyberpunkCard>
      ) : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  sectionTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  body: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 4 },
  message: { color: baseColors.cyan, fontFamily: fontFamilies.bodyMedium, lineHeight: 22 },
  warning: { color: baseColors.warning, fontFamily: fontFamilies.bodyMedium, lineHeight: 22, marginVertical: 10 },
});
