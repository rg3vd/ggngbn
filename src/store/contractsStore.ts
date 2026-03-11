import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/constants';
import { ContractTier, Goal, GoalContractState } from '@/types';
import { toDateKey } from '@/utils';

import { readJson, writeJson } from './storage';

interface ContractsStoreState {
  hydrated: boolean;
  contracts: Record<string, GoalContractState>;
  hydrate: () => void;
  ensureContract: (goal: Goal) => GoalContractState;
  setTier: (goalId: string, tier: ContractTier) => void;
  addShields: (goalId: string, count: number) => void;
  addRankXP: (goalId: string, amount: number) => void;
  reconcileFromTransactions: (goals: Goal[], transactions: { goalId: string; amount: number; date: string }[]) => Record<string, number>;
  reset: () => void;
}

const persistContracts = (contracts: Record<string, GoalContractState>): void => {
  writeJson(STORAGE_KEYS.contracts, contracts);
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

const buildDefaultContract = (goalId: string, tier: ContractTier = 'safe'): GoalContractState => {
  return {
    goalId,
    tier,
    gracePerWeek: tier === 'safe' ? 1 : 0,
    weekAnchorKey: isoWeekKey(new Date()),
    graceUsedDateKeys: [],
    shields: 0,
    shieldedDateKeys: [],
    rank: 1,
    rankXP: 0,
  };
};

const normalizeContract = (contract: GoalContractState): GoalContractState => {
  return {
    ...contract,
    tier: contract.tier ?? 'safe',
    gracePerWeek: typeof contract.gracePerWeek === 'number' ? contract.gracePerWeek : contract.tier === 'safe' ? 1 : 0,
    weekAnchorKey: contract.weekAnchorKey ?? isoWeekKey(new Date()),
    graceUsedDateKeys: Array.isArray(contract.graceUsedDateKeys) ? contract.graceUsedDateKeys : [],
    shields: Number.isFinite(contract.shields) ? Math.max(0, contract.shields) : 0,
    shieldedDateKeys: Array.isArray(contract.shieldedDateKeys) ? contract.shieldedDateKeys : [],
    rank: Number.isFinite(contract.rank) ? Math.max(1, contract.rank) : 1,
    rankXP: Number.isFinite(contract.rankXP) ? Math.max(0, contract.rankXP) : 0,
  };
};

const clampDateKeys = (keys: string[], max: number): string[] => {
  if (keys.length <= max) {
    return keys;
  }
  return keys.slice(keys.length - max);
};

const computeEffectiveStreakAndConsume = (
  contract: GoalContractState,
  depositDayKeysDesc: string[],
  todayKey: string
): { effectiveStreak: number; updated: GoalContractState } => {
  if (depositDayKeysDesc.length === 0) {
    return { effectiveStreak: 0, updated: contract };
  }

  const updated: GoalContractState = { ...contract };
  const currentWeek = isoWeekKey(new Date());
  if (updated.weekAnchorKey !== currentWeek) {
    updated.weekAnchorKey = currentWeek;
    updated.graceUsedDateKeys = [];
  }

  const canUseGrace = updated.tier === 'safe';
  const graceBudget = Math.max(updated.gracePerWeek - updated.graceUsedDateKeys.length, 0);
  let graceRemaining = graceBudget;
  let shieldsRemaining = updated.shields;

  const coveredGrace = new Set(updated.graceUsedDateKeys);
  const coveredShield = new Set(updated.shieldedDateKeys);

  const parseKey = (key: string): Date => new Date(key + 'T00:00:00');
  const formatKey = (d: Date): string => toDateKey(d.toISOString());
  const addDays = (d: Date, n: number): Date => {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
  };

  const latestKey = depositDayKeysDesc[0];
  let cursorKey = latestKey;
  let streak = 1;

  for (;;) {
    const cursorDate = parseKey(cursorKey);
    const prevKey = formatKey(addDays(cursorDate, -1));

    if (depositDayKeysDesc.includes(prevKey)) {
      streak += 1;
      cursorKey = prevKey;
      continue;
    }

    const missingKey = prevKey;
    const isInFuture = missingKey > todayKey;
    if (isInFuture) {
      break;
    }

    const alreadyCovered = coveredGrace.has(missingKey) || coveredShield.has(missingKey);
    if (alreadyCovered) {
      streak += 1;
      cursorKey = missingKey;
      continue;
    }

    if (canUseGrace && graceRemaining > 0) {
      graceRemaining -= 1;
      coveredGrace.add(missingKey);
      updated.graceUsedDateKeys = clampDateKeys([...coveredGrace].sort(), 90);
      streak += 1;
      cursorKey = missingKey;
      continue;
    }

    if (shieldsRemaining > 0) {
      shieldsRemaining -= 1;
      coveredShield.add(missingKey);
      updated.shields = shieldsRemaining;
      updated.shieldedDateKeys = clampDateKeys([...coveredShield].sort(), 180);
      streak += 1;
      cursorKey = missingKey;
      continue;
    }

    break;
  }

  return { effectiveStreak: streak, updated };
};

export const useContractsStore = create<ContractsStoreState>()(
  immer((set, get) => ({
    hydrated: false,
    contracts: {},
    hydrate: () => {
      const saved = readJson<Record<string, GoalContractState>>(STORAGE_KEYS.contracts, {});
      const normalized: Record<string, GoalContractState> = {};
      Object.entries(saved).forEach(([goalId, contract]) => {
        normalized[goalId] = normalizeContract(contract);
      });
      set((state) => {
        state.contracts = normalized;
        state.hydrated = true;
      });
    },
    ensureContract: (goal) => {
      const existing = get().contracts[goal.id];
      if (existing) {
        return existing;
      }
      const created = buildDefaultContract(goal.id, goal.mode === 'hardcore' ? 'hardcore' : 'safe');
      set((state) => {
        state.contracts[goal.id] = created;
      });
      persistContracts(get().contracts);
      return created;
    },
    setTier: (goalId, tier) => {
      set((state) => {
        const existing = state.contracts[goalId] ?? buildDefaultContract(goalId, tier);
        state.contracts[goalId] = {
          ...existing,
          tier,
          gracePerWeek: tier === 'safe' ? 1 : 0,
        };
      });
      persistContracts(get().contracts);
    },
    addShields: (goalId, count) => {
      if (count <= 0) {
        return;
      }
      set((state) => {
        const existing = state.contracts[goalId] ?? buildDefaultContract(goalId, 'safe');
        state.contracts[goalId] = { ...existing, shields: Math.max(0, existing.shields + count) };
      });
      persistContracts(get().contracts);
    },
    addRankXP: (goalId, amount) => {
      if (amount <= 0) {
        return;
      }
      set((state) => {
        const existing = state.contracts[goalId] ?? buildDefaultContract(goalId, 'safe');
        const nextXP = existing.rankXP + amount;
        const rankUps = Math.floor(nextXP / 100);
        state.contracts[goalId] = {
          ...existing,
          rankXP: nextXP % 100,
          rank: Math.min(existing.rank + rankUps, 10),
        };
      });
      persistContracts(get().contracts);
    },
    reconcileFromTransactions: (goals, transactions) => {
      const todayKey = toDateKey(new Date().toISOString());
      const streakMap: Record<string, number> = {};

      set((state) => {
        goals.forEach((goal) => {
          const existing = normalizeContract(state.contracts[goal.id] ?? buildDefaultContract(goal.id));
          const depositDayKeysDesc = [...new Set(transactions.filter((t) => t.goalId === goal.id).map((t) => toDateKey(t.date)))]
            .sort((a, b) => (a < b ? 1 : -1));

          const { effectiveStreak, updated } = computeEffectiveStreakAndConsume(existing, depositDayKeysDesc, todayKey);

          if (existing.tier === 'rogue' && depositDayKeysDesc.length > 0) {
            const lastDepositKey = depositDayKeysDesc[0];
            const needsDepositToday = lastDepositKey !== todayKey;
            if (needsDepositToday && updated.shields === 0) {
              updated.rank = Math.max(1, updated.rank - 1);
              updated.rankXP = 0;
            }
          }

          state.contracts[goal.id] = updated;
          streakMap[goal.id] = effectiveStreak;
        });
      });

      persistContracts(get().contracts);
      return streakMap;
    },
    reset: () => {
      set((state) => {
        state.contracts = {};
        state.hydrated = true;
      });
      persistContracts({});
    },
  }))
);
