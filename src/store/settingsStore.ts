import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { defaultNotificationText, STORAGE_KEYS } from '@/constants';
import { CommsPrivacyMode, GoalType, PriceNodeFetchMode, SettingsState } from '@/types';

import { readBoolean, readJson, readNumber, readString, storage } from './storage';

interface SettingsStoreActions {
  hydrate: () => void;
  setOnboardingComplete: (value: boolean) => void;
  setBriefingShown: (value: boolean) => void;
  setTutorialCompleted: (value: boolean) => void;
  setLanguage: (value: SettingsState['language']) => void;
  setNickname: (value: string) => void;
  setSelectedGoalTypes: (value: GoalType[]) => void;
  setActiveGoalId: (value: string | null) => void;
  setActiveTheme: (value: SettingsState['activeTheme']) => void;
  setCrtEnabled: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setNotifications: (value: SettingsState['notifications']) => void;
  setCurrency: (value: SettingsState['currency']) => void;
  setLastQuickDepositAmount: (value: number) => void;
  dismissInsight: (value: string) => void;
  setRatesLastUpdated: (value: string | null) => void;
  setProEnabled: (value: boolean) => void;
  setCommsNeuralEnabled: (value: boolean) => void;
  setCommsPrivacyMode: (value: CommsPrivacyMode) => void;
  setCommsOpenRouterModel: (value: string) => void;
  setCommsVoiceEnabled: (value: boolean) => void;
  setCommsVoiceAutoSpeak: (value: boolean) => void;
  markMilestoneSeen: (goalId: string, milestoneIndex: number) => void;
  setPriceNodeFetchMode: (mode: PriceNodeFetchMode) => void;
  addCosmeticTokens: (amount: number) => void;
  reset: () => void;
}

const defaultSettings: SettingsState = {
  hydrated: false,
  onboardingComplete: false,
  briefingShown: false,
  tutorialCompleted: false,
  language: 'uk',
  nickname: '',
  selectedGoalTypes: ['ps5'],
  activeGoalId: null,
  activeTheme: 'cyan',
  visualFx: { crtEnabled: true },
  soundEnabled: true,
  hapticsEnabled: true,
  notifications: {
    enabled: false,
    hour: 21,
    minute: 0,
    selectedWeekdays: [1, 2, 3, 4, 5, 6, 0],
    text: defaultNotificationText,
    streakAlertEnabled: true,
  },
  commsSettings: {
    neuralEnabled: false,
    privacyMode: 'blackout',
    openRouterModel: 'openai/gpt-4o-mini',
    voiceEnabled: false,
    voiceAutoSpeak: false,
  },
  currency: 'UAH',
  priceNodeSettings: { fetchMode: 'free' },
  lastQuickDepositAmount: 100,
  dismissedInsightIds: [],
  ratesLastUpdated: null,
  proEnabled: false,
  milestonesSeen: {},
  cosmeticTokens: 0,
};

const persistSettings = (state: SettingsState): void => {
  storage.set(STORAGE_KEYS.onboardingComplete, state.onboardingComplete);
  storage.set(STORAGE_KEYS.briefingShown, state.briefingShown);
  storage.set(STORAGE_KEYS.tutorialCompleted, state.tutorialCompleted);
  storage.set(STORAGE_KEYS.language, state.language);
  storage.set(STORAGE_KEYS.nickname, state.nickname);
  storage.set(STORAGE_KEYS.selectedGoalTypes, JSON.stringify(state.selectedGoalTypes));
  if (state.activeGoalId) {
    storage.set(STORAGE_KEYS.activeGoalId, state.activeGoalId);
  } else {
    storage.delete(STORAGE_KEYS.activeGoalId);
  }
  storage.set(STORAGE_KEYS.activeTheme, state.activeTheme);
  storage.set(STORAGE_KEYS.visualFx, JSON.stringify(state.visualFx));
  storage.set(STORAGE_KEYS.soundEnabled, state.soundEnabled);
  storage.set(STORAGE_KEYS.hapticsEnabled, state.hapticsEnabled);
  storage.set(STORAGE_KEYS.currency, state.currency);
  storage.set(STORAGE_KEYS.lastQuickDepositAmount, state.lastQuickDepositAmount);
  storage.set(STORAGE_KEYS.notificationSettings, JSON.stringify(state.notifications));
  storage.set(STORAGE_KEYS.commsSettings, JSON.stringify(state.commsSettings));
  storage.set(STORAGE_KEYS.priceNodeSettings, JSON.stringify(state.priceNodeSettings));
  storage.set(STORAGE_KEYS.dismissedInsights, JSON.stringify(state.dismissedInsightIds));
  storage.set(STORAGE_KEYS.proEnabled, state.proEnabled);
  storage.set(STORAGE_KEYS.milestonesSeen, JSON.stringify(state.milestonesSeen));
  storage.set(STORAGE_KEYS.cosmeticTokens, state.cosmeticTokens);
  if (state.ratesLastUpdated) {
    storage.set(STORAGE_KEYS.currencyRatesCache + '_updated_at', state.ratesLastUpdated);
  } else {
    storage.delete(STORAGE_KEYS.currencyRatesCache + '_updated_at');
  }
};

export const useSettingsStore = create<SettingsState & SettingsStoreActions>()(
  immer((set, get) => ({
    ...defaultSettings,
    hydrate: () => {
      set((state) => {
        state.onboardingComplete = readBoolean(STORAGE_KEYS.onboardingComplete, defaultSettings.onboardingComplete);
        state.briefingShown = readBoolean(STORAGE_KEYS.briefingShown, defaultSettings.briefingShown);
        state.tutorialCompleted = readBoolean(STORAGE_KEYS.tutorialCompleted, defaultSettings.tutorialCompleted);
        state.language = readString(STORAGE_KEYS.language, defaultSettings.language) as SettingsState['language'];
        state.nickname = readString(STORAGE_KEYS.nickname, defaultSettings.nickname);
        state.selectedGoalTypes = readJson<GoalType[]>(STORAGE_KEYS.selectedGoalTypes, defaultSettings.selectedGoalTypes);
        state.activeGoalId = storage.getString(STORAGE_KEYS.activeGoalId) ?? null;
        state.activeTheme = readString(STORAGE_KEYS.activeTheme, defaultSettings.activeTheme) as SettingsState['activeTheme'];
        state.visualFx = readJson(STORAGE_KEYS.visualFx, defaultSettings.visualFx);
        state.soundEnabled = readBoolean(STORAGE_KEYS.soundEnabled, defaultSettings.soundEnabled);
        state.hapticsEnabled = readBoolean(STORAGE_KEYS.hapticsEnabled, defaultSettings.hapticsEnabled);
        state.notifications = readJson(STORAGE_KEYS.notificationSettings, defaultSettings.notifications);
        state.commsSettings = { ...defaultSettings.commsSettings, ...readJson(STORAGE_KEYS.commsSettings, defaultSettings.commsSettings) };
        state.currency = readString(STORAGE_KEYS.currency, defaultSettings.currency) as SettingsState['currency'];
        state.priceNodeSettings = { ...defaultSettings.priceNodeSettings, ...readJson(STORAGE_KEYS.priceNodeSettings, defaultSettings.priceNodeSettings) };
        state.lastQuickDepositAmount = readNumber(STORAGE_KEYS.lastQuickDepositAmount, defaultSettings.lastQuickDepositAmount);
        state.dismissedInsightIds = readJson<string[]>(STORAGE_KEYS.dismissedInsights, defaultSettings.dismissedInsightIds);
        state.ratesLastUpdated = storage.getString(STORAGE_KEYS.currencyRatesCache + '_updated_at') ?? null;
        state.proEnabled = readBoolean(STORAGE_KEYS.proEnabled, defaultSettings.proEnabled);
        state.milestonesSeen = readJson<Record<string, number>>(STORAGE_KEYS.milestonesSeen, defaultSettings.milestonesSeen);
        state.cosmeticTokens = readNumber(STORAGE_KEYS.cosmeticTokens, defaultSettings.cosmeticTokens);
        state.hydrated = true;
      });
    },
    setOnboardingComplete: (value) => {
      set((state) => {
        state.onboardingComplete = value;
      });
      persistSettings(get());
    },
    setBriefingShown: (value) => {
      set((state) => {
        state.briefingShown = value;
      });
      persistSettings(get());
    },
    setTutorialCompleted: (value) => {
      set((state) => {
        state.tutorialCompleted = value;
      });
      persistSettings(get());
    },
    setLanguage: (value) => {
      set((state) => {
        state.language = value;
      });
      persistSettings(get());
    },
    setNickname: (value) => {
      set((state) => {
        state.nickname = value;
      });
      persistSettings(get());
    },
    setSelectedGoalTypes: (value) => {
      set((state) => {
        state.selectedGoalTypes = value;
      });
      persistSettings(get());
    },
    setActiveGoalId: (value) => {
      set((state) => {
        state.activeGoalId = value;
      });
      persistSettings(get());
    },
    setActiveTheme: (value) => {
      set((state) => {
        state.activeTheme = value;
      });
      persistSettings(get());
    },
    setCrtEnabled: (value) => {
      set((state) => {
        state.visualFx.crtEnabled = value;
      });
      persistSettings(get());
    },
    setSoundEnabled: (value) => {
      set((state) => {
        state.soundEnabled = value;
      });
      persistSettings(get());
    },
    setHapticsEnabled: (value) => {
      set((state) => {
        state.hapticsEnabled = value;
      });
      persistSettings(get());
    },
    setNotifications: (value) => {
      set((state) => {
        state.notifications = value;
      });
      persistSettings(get());
    },
    setCommsNeuralEnabled: (value) => {
      set((state) => {
        state.commsSettings.neuralEnabled = value;
      });
      persistSettings(get());
    },
    setCommsPrivacyMode: (value) => {
      set((state) => {
        state.commsSettings.privacyMode = value;
      });
      persistSettings(get());
    },
    setCommsOpenRouterModel: (value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      set((state) => {
        state.commsSettings.openRouterModel = trimmed;
      });
      persistSettings(get());
    },
    setCommsVoiceEnabled: (value) => {
      set((state) => {
        state.commsSettings.voiceEnabled = value;
        if (!value) {
          state.commsSettings.voiceAutoSpeak = false;
        }
      });
      persistSettings(get());
    },
    setCommsVoiceAutoSpeak: (value) => {
      set((state) => {
        state.commsSettings.voiceAutoSpeak = value;
        if (value) {
          state.commsSettings.voiceEnabled = true;
        }
      });
      persistSettings(get());
    },
    setPriceNodeFetchMode: (mode) => {
      set((state) => {
        state.priceNodeSettings.fetchMode = mode;
      });
      persistSettings(get());
    },
    setCurrency: (value) => {
      set((state) => {
        state.currency = value;
      });
      persistSettings(get());
    },
    setLastQuickDepositAmount: (value) => {
      set((state) => {
        state.lastQuickDepositAmount = value;
      });
      persistSettings(get());
    },
    dismissInsight: (value) => {
      set((state) => {
        if (!state.dismissedInsightIds.includes(value)) {
          state.dismissedInsightIds.push(value);
        }
      });
      persistSettings(get());
    },
    setRatesLastUpdated: (value) => {
      set((state) => {
        state.ratesLastUpdated = value;
      });
      persistSettings(get());
    },
    setProEnabled: (value) => {
      set((state) => {
        state.proEnabled = value;
      });
      persistSettings(get());
    },
    markMilestoneSeen: (goalId, milestoneIndex) => {
      set((state) => {
        const previous = state.milestonesSeen[goalId];
        if (previous === undefined || milestoneIndex > previous) {
          state.milestonesSeen[goalId] = milestoneIndex;
        }
      });
      persistSettings(get());
    },
    addCosmeticTokens: (amount) => {
      if (amount <= 0) {
        return;
      }
      set((state) => {
        state.cosmeticTokens += amount;
      });
      persistSettings(get());
    },
    reset: () => {
      set(() => ({
        ...defaultSettings,
        hydrated: true,
      }));
      persistSettings({ ...defaultSettings, hydrated: true });
    },
  }))
);






