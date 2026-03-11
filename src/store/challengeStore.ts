import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { dailyChallenges, STORAGE_KEYS } from '@/constants';
import { ChallengeRecord } from '@/types';

import { readJson, writeJson } from './storage';

interface ChallengeStoreState {
  hydrated: boolean;
  challenges: ChallengeRecord[];
  hydrate: () => void;
  ensureChallengeForDate: (dateKey: string) => ChallengeRecord;
  completeChallenge: (challengeId: string) => void;
  reset: () => void;
}

const persistChallenges = (challenges: ChallengeRecord[]): void => {
  writeJson(STORAGE_KEYS.challenges, challenges);
};

export const useChallengeStore = create<ChallengeStoreState>()(
  immer((set, get) => ({
    hydrated: false,
    challenges: [],
    hydrate: () => {
      const challenges = readJson<ChallengeRecord[]>(STORAGE_KEYS.challenges, []);
      set((state) => {
        state.challenges = challenges;
        state.hydrated = true;
      });
    },
    ensureChallengeForDate: (dateKey) => {
      const existing = get().challenges.find((challenge) => challenge.dateKey === dateKey);
      if (existing) {
        return existing;
      }

      const challenge: ChallengeRecord = {
        id: Math.random().toString(36).slice(2, 11),
        dateKey,
        challengeIndex: Math.abs(dateKey.split('-').join('').split('').reduce((sum, value) => sum + Number(value), 0)) % dailyChallenges.length,
        completed: false,
        completedAt: null,
      };

      set((state) => {
        state.challenges.push(challenge);
      });
      persistChallenges(get().challenges);
      return challenge;
    },
    completeChallenge: (challengeId) => {
      set((state) => {
        const challenge = state.challenges.find((item) => item.id === challengeId);
        if (!challenge) {
          return;
        }

        challenge.completed = true;
        challenge.completedAt = new Date().toISOString();
      });
      persistChallenges(get().challenges);
    },
    reset: () => {
      set((state) => {
        state.challenges = [];
        state.hydrated = true;
      });
      persistChallenges([]);
    },
  }))
);
