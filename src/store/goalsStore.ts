import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/constants';
import { Goal, GoalMode, GoalType } from '@/types';
import { calculateDailyStreak, sumTransactionsForGoal } from '@/utils';

import { readJson, writeJson } from './storage';

interface CreateGoalInput {
  type: GoalType;
  name: string;
  targetAmount: number;
  mode: GoalMode;
  targetDate?: string | null;
}

interface GoalsStoreState {
  hydrated: boolean;
  goals: Goal[];
  hydrate: () => void;
  createGoal: (input: CreateGoalInput) => Goal;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  archiveGoal: (goalId: string) => void;
  restoreGoal: (goalId: string) => void;
  removeGoalPermanently: (goalId: string) => void;
  replaceGoals: (goals: Goal[]) => void;
  syncGoalFromTransactions: (goalId: string, transactions: { goalId: string; amount: number; date: string }[]) => void;
  syncAllGoalsFromTransactions: (transactions: { goalId: string; amount: number; date: string }[]) => void;
  applyDailyStreakOverrides: (streaks: Record<string, number>) => void;
  reset: () => void;
}

const persistGoals = (goals: Goal[]): void => {
  writeJson(STORAGE_KEYS.goals, goals);
};

const normalizeGoals = (goals: Goal[]): Goal[] => {
  return goals.map((goal) => ({
    ...goal,
    archived: Boolean(goal.archived),
    activePlanType: goal.activePlanType ?? null,
    recommendedDailyAmount: goal.recommendedDailyAmount ?? null,
    archivedAt: goal.archivedAt ?? null,
  }));
};

export const useGoalsStore = create<GoalsStoreState>()(
  immer((set, get) => ({
    hydrated: false,
    goals: [],
    hydrate: () => {
      const goals = readJson<Goal[]>(STORAGE_KEYS.goals, []);
      set((state) => {
        state.goals = normalizeGoals(goals);
        state.hydrated = true;
      });
    },
    createGoal: (input) => {
      const goal: Goal = {
        id: Math.random().toString(36).slice(2, 11),
        type: input.type,
        name: input.name,
        targetAmount: input.targetAmount,
        currentAmount: 0,
        createdAt: new Date().toISOString(),
        mode: input.mode,
        dailyStreak: 0,
        lastDepositDate: null,
        archived: false,
        targetDate: input.targetDate ?? null,
        recommendedDailyAmount: null,
        activePlanType: null,
        archivedAt: null,
      };

      set((state) => {
        state.goals.push(goal);
      });
      persistGoals(get().goals);
      return goal;
    },
    updateGoal: (goalId, updates) => {
      set((state) => {
        const goal = state.goals.find((item) => item.id === goalId);
        if (!goal) {
          return;
        }

        Object.assign(goal, updates);
      });
      persistGoals(get().goals);
    },
    archiveGoal: (goalId) => {
      set((state) => {
        const goal = state.goals.find((item) => item.id === goalId);
        if (!goal) {
          return;
        }

        goal.archived = true;
        goal.archivedAt = new Date().toISOString();
      });
      persistGoals(get().goals);
    },
    restoreGoal: (goalId) => {
      set((state) => {
        const goal = state.goals.find((item) => item.id === goalId);
        if (!goal) {
          return;
        }

        goal.archived = false;
        goal.archivedAt = null;
      });
      persistGoals(get().goals);
    },
    removeGoalPermanently: (goalId) => {
      set((state) => {
        state.goals = state.goals.filter((goal) => goal.id !== goalId);
      });
      persistGoals(get().goals);
    },
    replaceGoals: (goals) => {
      set((state) => {
        state.goals = normalizeGoals(goals);
        state.hydrated = true;
      });
      persistGoals(get().goals);
    },
    syncGoalFromTransactions: (goalId, transactions) => {
      set((state) => {
        const goal = state.goals.find((item) => item.id === goalId);
        if (!goal) {
          return;
        }

        const goalTransactions = transactions.filter((transaction) => transaction.goalId === goalId);
        const latestTransaction = [...goalTransactions].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

        goal.currentAmount = sumTransactionsForGoal(goalTransactions, goalId);
        goal.lastDepositDate = latestTransaction?.date ?? null;
        goal.dailyStreak = calculateDailyStreak(goalTransactions.map((transaction) => transaction.date));
      });
      persistGoals(get().goals);
    },
    syncAllGoalsFromTransactions: (transactions) => {
      set((state) => {
        state.goals = state.goals.map((goal) => {
          const goalTransactions = transactions.filter((transaction) => transaction.goalId === goal.id);
          const latestTransaction = [...goalTransactions].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

          return {
            ...goal,
            currentAmount: sumTransactionsForGoal(goalTransactions, goal.id),
            lastDepositDate: latestTransaction?.date ?? null,
            dailyStreak: calculateDailyStreak(goalTransactions.map((transaction) => transaction.date)),
          };
        });
      });
      persistGoals(get().goals);
    },
    applyDailyStreakOverrides: (streaks) => {
      set((state) => {
        state.goals = state.goals.map((goal) => {
          const next = streaks[goal.id];
          if (typeof next !== 'number') {
            return goal;
          }
          if (goal.dailyStreak === next) {
            return goal;
          }
          return { ...goal, dailyStreak: Math.max(0, Math.floor(next)) };
        });
      });
      persistGoals(get().goals);
    },
    reset: () => {
      set((state) => {
        state.goals = [];
        state.hydrated = true;
      });
      persistGoals([]);
    },
  }))
);

