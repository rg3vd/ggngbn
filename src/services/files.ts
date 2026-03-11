import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Goal, Transaction } from '@/types';

interface BackupPayload {
  goals: Goal[];
  transactions: Transaction[];
}

const writeAndShare = async (fileName: string, contents: string): Promise<string> => {
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error('No writable directory available.');
  }

  const path = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(path, contents, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path);
  }

  return path;
};

export const exportJsonBackup = async (payload: BackupPayload): Promise<string> => {
  return writeAndShare('skarbna-backup.json', JSON.stringify(payload, null, 2));
};

export const exportTransactionsCsv = async (transactions: Transaction[]): Promise<string> => {
  const header = 'id,goalId,amount,date,comment,createdAt,mood';
  const rows = transactions.map((transaction) => {
    const safeComment = `"${transaction.comment.replace(/"/g, '""')}"`;
    return [transaction.id, transaction.goalId, transaction.amount, transaction.date, safeComment, transaction.createdAt, transaction.mood ?? ''].join(',');
  });

  return writeAndShare('skarbna-transactions.csv', [header, ...rows].join('\n'));
};

export const exportSummaryPdf = async (goals: Goal[], transactions: Transaction[]): Promise<string> => {
  const lines = [
    'Dream Piggy Bank Summary',
    '',
    `Goals: ${goals.length}`,
    `Transactions: ${transactions.length}`,
    '',
    ...goals.map((goal) => `${goal.name}: ${goal.currentAmount}/${goal.targetAmount}`),
  ];

  const body = lines.join('\n');
  const escapedBody = body.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 12 Tf 40 760 Td (${escapedBody.split('\n').join(') Tj T* (')}) Tj ET`;
  const pdf = `%PDF-1.3\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000122 00000 n \n0000000253 00000 n \n0000000388 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n458\n%%EOF`;

  return writeAndShare('skarbna-summary.pdf', pdf);
};

export const readBackupFile = async (uri: string): Promise<BackupPayload> => {
  const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  const parsed = JSON.parse(content) as Partial<BackupPayload>;

  if (!Array.isArray(parsed.goals) || !Array.isArray(parsed.transactions)) {
    throw new Error('Invalid backup shape.');
  }

  return {
    goals: parsed.goals as Goal[],
    transactions: parsed.transactions as Transaction[],
  };
};
