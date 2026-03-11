import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { achievementDefinitions, STORAGE_KEYS } from '@/constants';
import { Goal, Transaction, UnlockedAchievement } from '@/types';
import { calculateGoalProgress } from '@/utils';

import { readJson, writeJson } from './storage';

interface AchievementsStoreState {
  hydrated: boolean;
  achievements: UnlockedAchievement[];
  hydrate: () => void;
  unlockAchievement: (badgeKey: string, goalId: string | null) => void;
  evaluateAchievements: (goals: Goal[], transactions: Transaction[]) => void;
  reset: () => void;
}

const persistAchievements = (achievements: UnlockedAchievement[]): void => {
  writeJson(STORAGE_KEYS.achievements, achievements);
};

export const useAchievementsStore = create<AchievementsStoreState>()(
  immer((set, get) => ({
    hydrated: false,
    achievements: [],
    hydrate: () => {
      const achievements = readJson<UnlockedAchievement[]>(STORAGE_KEYS.achievements, []);
      set((state) => {
        state.achievements = achievements;
        state.hydrated = true;
      });
    },
    unlockAchievement: (badgeKey, goalId) => {
      if (get().achievements.some((achievement) => achievement.badgeKey === badgeKey && achievement.goalId === goalId)) {
        return;
      }

      set((state) => {
        state.achievements.push({
          id: Math.random().toString(36).slice(2, 11),
          badgeKey,
          unlockedAt: new Date().toISOString(),
          goalId,
        });
      });
      persistAchievements(get().achievements);
    },
    evaluateAchievements: (goals, transactions) => {
      const depositCount = transactions.length;
      const maxStreak = goals.reduce((highest, goal) => Math.max(highest, goal.dailyStreak), 0);

      achievementDefinitions.forEach((definition) => {
        switch (definition.category) {
          case 'depositCount':
            if (depositCount >= definition.threshold) {
              get().unlockAchievement(definition.key, null);
            }
            break;
          case 'streak':
            if (maxStreak >= definition.threshold) {
              get().unlockAchievement(definition.key, null);
            }
            break;
          case 'progress':
          case 'milestone':
            goals.forEach((goal) => {
              const progress = calculateGoalProgress(goal) * 100;
              if (progress >= definition.threshold) {
                get().unlockAchievement(definition.key, goal.id);
              }
            });
            break;
          default:
            break;
        }
      });
    },
    reset: () => {
      set((state) => {
        state.achievements = [];
        state.hydrated = true;
      });
      persistAchievements([]);
    },
  }))
);
