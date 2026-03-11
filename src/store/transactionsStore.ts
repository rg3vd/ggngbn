import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/constants';
import { Transaction } from '@/types';

import { useAchievementsStore } from './achievementsStore';
import { useContractsStore } from './contractsStore';
import { useMissionRoutesStore } from './missionRoutesStore';
import { useSettingsStore } from './settingsStore';
import { useGoalsStore } from './goalsStore';
import { readJson, writeJson } from './storage';
import { useStreakStore } from './streakStore';

interface CreateTransactionInput {
  goalId: string;
  amount: number;
  date: string;
  comment: string;
  mood: Transaction['mood'];
}

interface TransactionsStoreState {
  hydrated: boolean;
  transactions: Transaction[];
  hydrate: () => void;
  addTransaction: (input: CreateTransactionInput) => Transaction;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (transactionId: string) => void;
  replaceTransactions: (transactions: Transaction[]) => void;
  reset: () => void;
}

const persistTransactions = (transactions: Transaction[]): void => {
  writeJson(STORAGE_KEYS.transactions, transactions);
};

const syncRelatedStores = (transactions: Transaction[]): void => {
  const goalsStore = useGoalsStore.getState();
  goalsStore.syncAllGoalsFromTransactions(transactions);
  const goals = useGoalsStore.getState().goals;

  // Contracts can modify the effective streak via grace/shields.
  const streaks = useContractsStore.getState().reconcileFromTransactions(goals, transactions);
  useGoalsStore.getState().applyDailyStreakOverrides(streaks);

  useMissionRoutesStore.getState().refresh(transactions, useSettingsStore.getState().activeGoalId);
  useStreakStore.getState().refresh(useGoalsStore.getState().goals, transactions);
  useAchievementsStore.getState().evaluateAchievements(useGoalsStore.getState().goals, transactions);
};

const normalizeTransactions = (transactions: Transaction[]): Transaction[] => {
  return transactions.map((transaction) => ({
    ...transaction,
    mood: transaction.mood ?? null,
  }));
};

export const useTransactionsStore = create<TransactionsStoreState>()(
  immer((set, get) => ({
    hydrated: false,
    transactions: [],
    hydrate: () => {
      const transactions = normalizeTransactions(readJson<Transaction[]>(STORAGE_KEYS.transactions, []));
      set((state) => {
        state.transactions = transactions;
        state.hydrated = true;
      });
      syncRelatedStores(transactions);
    },
    addTransaction: (input) => {
      const transaction: Transaction = {
        id: Math.random().toString(36).slice(2, 11),
        goalId: input.goalId,
        amount: input.amount,
        date: input.date,
        comment: input.comment,
        createdAt: new Date().toISOString(),
        mood: input.mood,
      };

      set((state) => {
        state.transactions.unshift(transaction);
      });
      persistTransactions(get().transactions);
      syncRelatedStores(get().transactions);
      return transaction;
    },
    updateTransaction: (transactionId, updates) => {
      set((state) => {
        const transaction = state.transactions.find((item) => item.id === transactionId);
        if (!transaction) {
          return;
        }

        Object.assign(transaction, updates);
      });
      persistTransactions(get().transactions);
      syncRelatedStores(get().transactions);
    },
    deleteTransaction: (transactionId) => {
      set((state) => {
        state.transactions = state.transactions.filter((transaction) => transaction.id !== transactionId);
      });
      persistTransactions(get().transactions);
      syncRelatedStores(get().transactions);
    },
    replaceTransactions: (transactions) => {
      const normalized = normalizeTransactions(transactions);
      set((state) => {
        state.transactions = normalized;
        state.hydrated = true;
      });
      persistTransactions(get().transactions);
      syncRelatedStores(normalized);
    },
    reset: () => {
      set((state) => {
        state.transactions = [];
        state.hydrated = true;
      });
      persistTransactions([]);
      syncRelatedStores([]);
    },
  }))
);

