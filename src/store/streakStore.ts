import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { Goal, StreakStats, Transaction } from '@/types';
import { buildStreakStats } from '@/utils';

interface StreakStoreState {
  hydrated: boolean;
  statsByGoalId: Record<string, StreakStats>;
  hydrate: () => void;
  refresh: (goals: Goal[], transactions: Transaction[]) => void;
  reset: () => void;
}

export const useStreakStore = create<StreakStoreState>()(
  immer((set) => ({
    hydrated: false,
    statsByGoalId: {},
    hydrate: () => {
      set((state) => {
        state.hydrated = true;
      });
    },
    refresh: (goals, transactions) => {
      set((state) => {
        state.statsByGoalId = goals.reduce<Record<string, StreakStats>>((accumulator, goal) => {
          accumulator[goal.id] = buildStreakStats(goal, transactions);
          return accumulator;
        }, {});
        state.hydrated = true;
      });
    },
    reset: () => {
      set((state) => {
        state.statsByGoalId = {};
        state.hydrated = true;
      });
    },
  }))
);
