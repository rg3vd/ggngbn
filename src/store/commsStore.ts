import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

import { STORAGE_KEYS } from '@/constants';
import { buildCommsCapsule, buildOfflineCoachReply } from '@/services/commsOfflineCoach';
import { applyBlackoutMask, buildSystemPrompt, openRouterChat } from '@/services/openrouter';
import { getOpenRouterApiKey } from '@/services/openrouterVault';
import { useContractsStore } from '@/store/contractsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { usePriceNodeStore } from '@/store/priceNodeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactionsStore } from '@/store/transactionsStore';
import { CommsMessage, Goal } from '@/types';
import { toDateKey } from '@/utils';

import { readJson, readString, storage } from './storage';

interface CommsUsage {
  dateKey: string;
  count: number;
}

interface CommsStoreState {
  hydrated: boolean;
  messages: CommsMessage[];
  draft: string;
}

interface CommsStoreActions {
  hydrate: () => void;
  setDraft: (value: string) => void;
  sendDraft: () => Promise<void>;
  pushSystemMessage: (content: string) => void;
}

const defaultState: CommsStoreState = {
  hydrated: false,
  messages: [],
  draft: '',
};

const defaultUsage: CommsUsage = {
  dateKey: '',
  count: 0,
};

const persist = (state: CommsStoreState): void => {
  storage.set(STORAGE_KEYS.commsMessages, JSON.stringify(state.messages));
  storage.set(STORAGE_KEYS.commsDraft, state.draft);
};

const readUsage = (todayKey: string): CommsUsage => {
  const existing = readJson<CommsUsage>(STORAGE_KEYS.commsUsage, defaultUsage);
  if (existing.dateKey !== todayKey) {
    return { dateKey: todayKey, count: 0 };
  }
  return existing;
};

const writeUsage = (usage: CommsUsage): void => {
  storage.set(STORAGE_KEYS.commsUsage, JSON.stringify(usage));
};

const resolveActiveGoal = (goals: Goal[], activeGoalId: string | null): Goal | null => {
  const active = activeGoalId ? goals.find((g) => g.id === activeGoalId) ?? null : null;
  return active ?? goals[0] ?? null;
};

export const useCommsStore = create<CommsStoreState & CommsStoreActions>()(
  immer((set, get) => ({
    ...defaultState,
    hydrate: () => {
      set((state) => {
        state.messages = readJson<CommsMessage[]>(STORAGE_KEYS.commsMessages, defaultState.messages);
        state.draft = readString(STORAGE_KEYS.commsDraft, defaultState.draft);
        state.hydrated = true;
      });
    },
    setDraft: (value) => {
      set((state) => {
        state.draft = value;
      });
      persist(get());
    },
    pushSystemMessage: (content) => {
      const text = content.trim();
      if (!text) {
        return;
      }

      const now = new Date().toISOString();
      set((state) => {
        const last = state.messages[state.messages.length - 1];
        if (last && last.role === 'system' && last.content === text) {
          return;
        }
        state.messages.push({
          id: uuidv4(),
          role: 'system',
          content: text,
          createdAt: now,
          status: 'done',
        });
      });
      persist(get());
    },
    sendDraft: async () => {
      const draft = get().draft.trim();
      if (!draft) {
        return;
      }

      const now = new Date().toISOString();
      const todayKey = toDateKey(now);

      const assistantId = uuidv4();

      const userMessage: CommsMessage = {
        id: uuidv4(),
        role: 'user',
        content: draft,
        createdAt: now,
        status: 'done',
      };

      const assistantMessage: CommsMessage = {
        id: assistantId,
        role: 'assistant',
        content: 'LINK ESTABLISHING...',
        createdAt: now,
        status: 'pending',
      };

      set((state) => {
        state.messages.push(userMessage, assistantMessage);
        state.draft = '';
      });
      persist(get());

      const settings = useSettingsStore.getState();
      const goals = useGoalsStore.getState().goals.filter((g) => !g.archived);
      const transactions = useTransactionsStore.getState().transactions;
      const activeGoal = resolveActiveGoal(goals, settings.activeGoalId);

      const priceSources = activeGoal ? usePriceNodeStore.getState().byGoalId[activeGoal.id]?.sources ?? [] : [];
      const contract = activeGoal ? useContractsStore.getState().contracts[activeGoal.id] ?? null : null;

      const offlineCtx = {
        goals,
        transactions,
        activeGoalId: settings.activeGoalId,
        currency: settings.currency,
        privacyMode: settings.commsSettings.privacyMode,
        priceSources,
        contractTier: contract?.tier ?? null,
        shields: contract?.shields ?? 0,
      };

      const updateAssistant = (content: string, status: CommsMessage['status'], role?: CommsMessage['role']) => {
        set((state) => {
          const target = state.messages.find((m) => m.id === assistantId);
          if (!target) {
            return;
          }
          target.content = content;
          target.status = status;
          if (role) {
            target.role = role;
          }
        });
        persist(get());
      };

      if (!settings.commsSettings.neuralEnabled) {
        const reply = buildOfflineCoachReply(draft, offlineCtx);
        updateAssistant(reply.text, 'done');
        return;
      }

      const apiKey = await getOpenRouterApiKey();
      if (!apiKey) {
        updateAssistant('Мені душно без API KEY. Відкрий KEY VAULT у COMMS і додай ключ OpenRouter.', 'error', 'system');
        return;
      }

      const usage = readUsage(todayKey);
      const freeLimit = 5;
      if (!settings.proEnabled && usage.count >= freeLimit) {
        updateAssistant('FREE QUOTA EXCEEDED (5/day). Wait until tomorrow or enable PRO.', 'error', 'system');
        return;
      }

      try {
        const capsule = buildCommsCapsule(offlineCtx, activeGoal);
        const system = buildSystemPrompt() + '\n\n' + capsule;

        const reply = await openRouterChat({
          apiKey,
          model: settings.commsSettings.openRouterModel,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: draft },
          ],
        });

        const finalText = settings.commsSettings.privacyMode === 'blackout' ? applyBlackoutMask(reply) : reply;
        updateAssistant(finalText, 'done');

        if (!settings.proEnabled) {
          writeUsage({ ...usage, count: usage.count + 1 });
        }
      } catch (error) {
        updateAssistant(`LINK FAILURE. ${error instanceof Error ? error.message : 'unknown_error'}`, 'error', 'system');
      }
    },
  }))
);