export type GoalType = 'ps5' | 'monitor';
export type GoalMode = 'casual' | 'hardcore' | 'auto';
export type ActivePlanType = 'aggressive' | 'balanced' | 'weekend' | null;
export type TransactionMood = 'hyped' | 'disciplined' | 'routine' | 'forced' | null;
export type SupportedLanguage = 'uk' | 'en';
export type CurrencyCode = 'UAH' | 'USD' | 'EUR';
export type AccentColorKey = 'purple' | 'cyan' | 'green' | 'pink';
export type ThemeKey = AccentColorKey;
export type ContractTier = 'safe' | 'hardcore' | 'rogue';

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  mode: GoalMode;
  dailyStreak: number;
  lastDepositDate: string | null;
  archived: boolean;
  targetDate: string | null;
  recommendedDailyAmount: number | null;
  activePlanType: ActivePlanType;
  archivedAt?: string | null;
}

export interface Transaction {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  comment: string;
  createdAt: string;
  mood: TransactionMood;
}

export interface ChallengeRecord {
  id: string;
  dateKey: string;
  challengeIndex: number;
  completed: boolean;
  completedAt: string | null;
}

export interface UnlockedAchievement {
  id: string;
  badgeKey: string;
  unlockedAt: string;
  goalId: string | null;
}

export interface NotificationPreferences {
  enabled: boolean;
  hour: number;
  minute: number;
  selectedWeekdays: number[];
  text: string;
  streakAlertEnabled: boolean;
}
export interface VisualFxSettings {
  crtEnabled: boolean;
}

export type PriceNodeFetchMode = 'free' | 'hybrid' | 'zenrows';

export interface PriceNodeSettings {
  fetchMode: PriceNodeFetchMode;
}
export type CommsRole = 'user' | 'assistant' | 'system';
export type CommsMessageStatus = 'pending' | 'done' | 'error';
export type CommsPrivacyMode = 'blackout' | 'full';

export interface CommsMessage {
  id: string;
  role: CommsRole;
  content: string;
  createdAt: string;
  status?: CommsMessageStatus;
}

export interface CommsSettings {
  neuralEnabled: boolean;
  privacyMode: CommsPrivacyMode;
  openRouterModel: string;
  voiceEnabled: boolean;
  voiceAutoSpeak: boolean;
}
export interface SettingsState {
  hydrated: boolean;
  onboardingComplete: boolean;
  briefingShown: boolean;
  tutorialCompleted: boolean;
  language: SupportedLanguage;
  nickname: string;
  selectedGoalTypes: GoalType[];
  activeGoalId: string | null;
  activeTheme: ThemeKey;
  visualFx: VisualFxSettings;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notifications: NotificationPreferences;
  priceNodeSettings: PriceNodeSettings;
  commsSettings: CommsSettings;
  currency: CurrencyCode;
  lastQuickDepositAmount: number;
  dismissedInsightIds: string[];
  ratesLastUpdated: string | null;
  proEnabled: boolean;
  milestonesSeen: Record<string, number>;
  cosmeticTokens: number;
}

export interface StreakStats {
  current: number;
  longest: number;
  totalDepositDays: number;
  daysSinceGoalCreated: number;
  weeklyPace: number;
  monthlyPace: number;
}

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  threshold: number;
  category: 'depositCount' | 'streak' | 'progress' | 'milestone';
}

export interface DailyChallengeDefinition {
  id: string;
  text: string;
}

export interface CurrencyRatesCache {
  base: CurrencyCode;
  fetchedAt: string;
  rates: Record<CurrencyCode, number>;
  source: 'remote' | 'cache';
}


export interface GoalContractState {
  goalId: string;
  tier: ContractTier;
  gracePerWeek: number;
  weekAnchorKey: string;
  graceUsedDateKeys: string[];
  shields: number;
  shieldedDateKeys: string[];
  rank: number;
  rankXP: number;
}

export type WeeklyMissionType = 'deposit_days' | 'volume_run' | 'focus_ops';

export interface WeeklyMission {
  id: string;
  type: WeeklyMissionType;
  title: string;
  description: string;
  target: number;
  rewardShields: number;
  rewardRankXP: number;
  rewardCosmeticTokens: number;
}

export interface WeeklyMissionProgress {
  weekAnchorKey: string;
  missions: WeeklyMission[];
  completedMissionIds: string[];
  claimedMissionIds: string[];
  vault: {
    depositDayCount: number;
    volumeTotal: number;
  };
  focus: {
    goalId: string | null;
    depositCount: number;
  };
}
export type PriceSourceDomain = string;
export type PriceAvailability = 'in_stock' | 'preorder' | 'out' | 'unknown';

export interface PricePoint {
  dateKey: string;
  priceUAH: number;
}

export interface PriceSourceState {
  id: string;
  goalId: string;
  name: string;
  url: string;
  urlCanonical: string;
  domain: PriceSourceDomain;
  isPreset: boolean;
  last?: {
    priceUAH: number;
    fetchedAt: string;
    availability: PriceAvailability;
  };
  history30d: PricePoint[];
  lastError?: string | null;
  lastAttemptAt?: string | null;
}

export interface PriceNodeState {
  hydrated: boolean;
  byGoalId: Record<string, { sources: PriceSourceState[] }>;
}



