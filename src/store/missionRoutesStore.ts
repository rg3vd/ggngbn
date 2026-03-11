import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/constants';
import { WeeklyMission, WeeklyMissionProgress } from '@/types';
import { toDateKey } from '@/utils';

import { readJson, writeJson } from './storage';

interface MissionRoutesStoreState {
  hydrated: boolean;
  state: WeeklyMissionProgress | null;
  hydrate: () => void;
  refresh: (transactions: { goalId: string; amount: number; date: string }[], focusGoalId: string | null) => WeeklyMissionProgress;
  claim: (missionId: string) => void;
  reset: () => void;
}

const persist = (value: WeeklyMissionProgress | null): void => {
  writeJson(STORAGE_KEYS.missionRoutes, value);
};

const isoWeekKey = (date: Date): string => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((tmp.getTime() - firstThursday.getTime()) / 604800000);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const buildMissions = (): WeeklyMission[] => {
  return [
    {
      id: 'DEPOSIT_DAYS',
      type: 'deposit_days',
      title: 'DEPOSIT DAYS',
      description: 'Зроби депозити у 3 різні дні цього тижня.',
      target: 3,
      rewardShields: 1,
      rewardRankXP: 20,
      rewardCosmeticTokens: 0,
    },
    {
      id: 'VOLUME_RUN',
      type: 'volume_run',
      title: 'VOLUME RUN',
      description: 'Набери 1000 UAH обʼєму депозитів за тиждень.',
      target: 1000,
      rewardShields: 1,
      rewardRankXP: 30,
      rewardCosmeticTokens: 1,
    },
    {
      id: 'FOCUS_OPS',
      type: 'focus_ops',
      title: 'FOCUS OPS',
      description: 'Зроби 5 депозитів у активну ціль (focus bonus).',
      target: 5,
      rewardShields: 1,
      rewardRankXP: 40,
      rewardCosmeticTokens: 1,
    },
  ];
};

const normalize = (state: WeeklyMissionProgress | null): WeeklyMissionProgress | null => {
  if (!state) {
    return null;
  }
  return {
    weekAnchorKey: state.weekAnchorKey ?? isoWeekKey(new Date()),
    missions: Array.isArray(state.missions) ? state.missions : buildMissions(),
    completedMissionIds: Array.isArray(state.completedMissionIds) ? state.completedMissionIds : [],
    claimedMissionIds: Array.isArray(state.claimedMissionIds) ? state.claimedMissionIds : [],
    vault: state.vault ?? { depositDayCount: 0, volumeTotal: 0 },
    focus: state.focus ?? { goalId: null, depositCount: 0 },
  };
};

const computeWeekProgress = (
  transactions: { goalId: string; amount: number; date: string }[],
  focusGoalId: string | null
): Omit<WeeklyMissionProgress, 'missions' | 'weekAnchorKey' | 'completedMissionIds' | 'claimedMissionIds'> => {
  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 6);
  const sinceKey = toDateKey(since.toISOString());

  const recent = transactions.filter((t) => toDateKey(t.date) >= sinceKey);
  const dayKeys = new Set(recent.map((t) => toDateKey(t.date)));
  const volumeTotal = recent.reduce((sum, t) => sum + t.amount, 0);
  const focusDeposits = focusGoalId ? recent.filter((t) => t.goalId === focusGoalId).length : 0;

  return {
    vault: { depositDayCount: dayKeys.size, volumeTotal },
    focus: { goalId: focusGoalId, depositCount: focusDeposits },
  };
};

export const useMissionRoutesStore = create<MissionRoutesStoreState>()(
  immer((set, get) => ({
    hydrated: false,
    state: null,
    hydrate: () => {
      const saved = normalize(readJson<WeeklyMissionProgress | null>(STORAGE_KEYS.missionRoutes, null));
      set((draft) => {
        draft.state = saved;
        draft.hydrated = true;
      });
    },
    refresh: (transactions, focusGoalId) => {
      const weekAnchorKey = isoWeekKey(new Date());
      const previous = normalize(get().state);
      const missions = previous?.missions ?? buildMissions();
      const completed = new Set(previous?.completedMissionIds ?? []);
      const claimed = new Set(previous?.claimedMissionIds ?? []);

      const progress = computeWeekProgress(transactions, focusGoalId);

      missions.forEach((mission) => {
        let ok = false;
        switch (mission.type) {
          case 'deposit_days':
            ok = progress.vault.depositDayCount >= mission.target;
            break;
          case 'volume_run':
            ok = progress.vault.volumeTotal >= mission.target;
            break;
          case 'focus_ops':
            ok = progress.focus.depositCount >= mission.target;
            break;
          default:
            ok = false;
        }
        if (ok) {
          completed.add(mission.id);
        }
      });

      const next: WeeklyMissionProgress = {
        weekAnchorKey,
        missions,
        completedMissionIds: [...completed],
        claimedMissionIds: [...claimed],
        vault: progress.vault,
        focus: progress.focus,
      };

      set((draft) => {
        draft.state = next;
      });
      persist(next);
      return next;
    },
    claim: (missionId) => {
      const current = normalize(get().state);
      if (!current) {
        return;
      }
      if (!current.completedMissionIds.includes(missionId) || current.claimedMissionIds.includes(missionId)) {
        return;
      }
      set((draft) => {
        if (!draft.state) {
          return;
        }
        draft.state.claimedMissionIds.push(missionId);
      });
      persist(get().state);
    },
    reset: () => {
      set((draft) => {
        draft.state = null;
        draft.hydrated = true;
      });
      persist(null);
    },
  }))
);
