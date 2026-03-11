import { AchievementDefinition, DailyChallengeDefinition } from '@/types';

export const STORAGE_KEYS = {
  goals: 'goals',
  transactions: 'transactions',
  challenges: 'challenges',
  achievements: 'achievements',
  contracts: 'contracts',
  missionRoutes: 'mission_routes',
  onboardingComplete: 'onboarding_complete',
  briefingShown: 'briefing_shown',
  tutorialCompleted: 'tutorial_completed',
  nickname: 'nickname',
  language: 'language',
  selectedGoalTypes: 'selected_goal_types',
  activeGoalId: 'active_goal_id',
  activeTheme: 'active_theme',
  soundEnabled: 'sound_enabled',
  hapticsEnabled: 'haptics_enabled',
  notificationSettings: 'notification_settings',
  smartReminderIds: 'smart_reminder_ids',
  currency: 'currency',
  lastQuickDepositAmount: 'last_quick_deposit_amount',
  dismissedInsights: 'dismissed_insights',
  currencyRatesCache: 'currency_rates_cache',
  proEnabled: 'pro_enabled',
  milestonesSeen: 'milestones_seen',
  cosmeticTokens: 'cosmetic_tokens',
  visualFx: 'visual_fx',
  commsSettings: 'comms_settings',
  commsMessages: 'comms_messages',
  commsDraft: 'comms_draft',
  commsUsage: 'comms_usage',
  priceNode: 'price_node',
  priceNodeSettings: 'price_node_settings',
} as const;

export const motivationalPhrases = [
  'Ще один депозит — ще один крок до твоєї мрії.',
  'Не чекай ідеального моменту. Поповни зараз.',
  'Ти не просто відкладаєш — ти прокачуєш дисципліну.',
  'Навіть маленький внесок змінює фінальний результат.',
  'Система любить послідовність. Тримай темп.',
  'Нехай сьогоднішня гривня працює на завтрашній апгрейд.',
  'Кожен депозит — це сигнал: місія триває.',
  'Твоя ціль ближче, ніж здається. Не зупиняйся.',
] as const;

export const dailyChallenges: DailyChallengeDefinition[] = [
  { id: 'challenge_01', text: 'Add any deposit today.' },
  { id: 'challenge_02', text: 'Make two deposits in one day.' },
  { id: 'challenge_03', text: 'Deposit more than yesterday.' },
  { id: 'challenge_04', text: 'Add a deposit with a mood tag.' },
  { id: 'challenge_05', text: 'Deposit 150 UAH and break the midpoint barrier.' },
  { id: 'challenge_06', text: 'Make a deposit within 5 minutes of opening the app.' },
  { id: 'challenge_07', text: 'Add a comment longer than 10 characters.' },
  { id: 'challenge_08', text: 'Reach 25% of your goal.' },
] as const;

export const achievementDefinitions: AchievementDefinition[] = [
  {
    key: 'first_deposit',
    title: 'First Voltage',
    description: 'Add your very first deposit.',
    threshold: 1,
    category: 'depositCount',
  },
  {
    key: 'deposit_10',
    title: 'Rhythm Locked',
    description: 'Complete 10 deposits.',
    threshold: 10,
    category: 'depositCount',
  },
  {
    key: 'streak_3',
    title: 'Neon Habit',
    description: 'Reach a 3-day deposit streak.',
    threshold: 3,
    category: 'streak',
  },
  {
    key: 'streak_7',
    title: 'Cyber Discipline',
    description: 'Reach a 7-day deposit streak.',
    threshold: 7,
    category: 'streak',
  },
  {
    key: 'progress_25',
    title: 'Quarter Signal',
    description: 'Reach 25% of any goal.',
    threshold: 25,
    category: 'progress',
  },
  {
    key: 'progress_100',
    title: 'Mission Complete',
    description: 'Complete a savings goal.',
    threshold: 100,
    category: 'milestone',
  },
] as const;

export const defaultNotificationText = 'AGENT, YOUR GOAL AWAITS';

export const bottomNavRoutes = [
  '/(screens)/screen_03_dashboard',
  '/(screens)/screen_05_analytics',
  '/(screens)/screen_06_history',
  '/(screens)/screen_07_achievements',
  '/(screens)/screen_08_profile',
  '/(screens)/screen_34_comms',
] as const;







