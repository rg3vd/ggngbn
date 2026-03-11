import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns';

import { CommsPrivacyMode, Goal, StreakStats, Transaction } from '@/types';

type TransactionLike = Pick<Transaction, 'goalId' | 'amount' | 'date'>;

export const formatCurrency = (value: number, currency: string = 'UAH'): string => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const maskMoneyText = (text: string): string => {
  return text.replace(/[0-9]/g, '█');
};

export const formatCurrencyPrivacy = (
  value: number,
  currency: string = 'UAH',
  privacyMode: CommsPrivacyMode = 'full'
): string => {
  if (privacyMode === 'blackout') {
    const sign = value < 0 ? '-' : '';
    if (currency === 'UAH') {
      return sign + '₴████';
    }
    return sign + currency.toUpperCase() + ' ████';
  }
  return formatCurrency(value, currency);
};
export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
};

export const formatDisplayDate = (iso: string): string => {
  return format(parseISO(iso), 'dd.MM.yyyy');
};

export const toDateKey = (iso: string): string => {
  return format(parseISO(iso), 'yyyy-MM-dd');
};

export const sumTransactionsForGoal = (transactions: TransactionLike[], goalId: string): number => {
  return transactions
    .filter((transaction) => transaction.goalId === goalId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
};

export const calculateGoalProgress = (goal: Goal): number => {
  if (goal.targetAmount <= 0) {
    return 0;
  }

  return Math.min(goal.currentAmount / goal.targetAmount, 1);
};

export const calculateRemainingAmount = (goal: Goal): number => {
  return Math.max(goal.targetAmount - goal.currentAmount, 0);
};

export const calculateAverageDeposit = (transactions: Transaction[], goalId: string): number => {
  const goalTransactions = transactions.filter((transaction) => transaction.goalId === goalId);
  if (goalTransactions.length === 0) {
    return 0;
  }

  return sumTransactionsForGoal(goalTransactions, goalId) / goalTransactions.length;
};

export const calculateDailyStreak = (depositDates: string[]): number => {
  if (depositDates.length === 0) {
    return 0;
  }

  const uniqueDays = [...new Set(depositDates.map((item) => toDateKey(item)))].sort((a, b) => (a < b ? 1 : -1));
  let streak = 0;
  let cursor = startOfDay(parseISO(uniqueDays[0] + 'T00:00:00'));

  for (const dayKey of uniqueDays) {
    const currentDate = startOfDay(parseISO(dayKey + 'T00:00:00'));
    if (isSameDay(currentDate, cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    if (differenceInCalendarDays(cursor, currentDate) === 0) {
      continue;
    }

    break;
  }

  return streak;
};

export const shouldIncrementStreak = (lastDepositDate: string | null, nextDepositDate: string): boolean => {
  if (!lastDepositDate) {
    return true;
  }

  return !isSameDay(parseISO(lastDepositDate), parseISO(nextDepositDate));
};

export const calculateForecastDate = (goal: Goal, transactions: Transaction[]): string | null => {
  const remaining = calculateRemainingAmount(goal);
  if (remaining <= 0) {
    return goal.lastDepositDate ?? goal.createdAt;
  }

  const goalTransactions = transactions.filter((transaction) => transaction.goalId === goal.id);
  if (goalTransactions.length === 0) {
    return null;
  }

  const sorted = [...goalTransactions].sort((a, b) => a.date.localeCompare(b.date));
  const first = parseISO(sorted[0].date);
  const last = parseISO(sorted[sorted.length - 1].date);
  const activeDays = Math.max(differenceInCalendarDays(endOfDay(last), startOfDay(first)) + 1, 1);
  const averagePerDay = sumTransactionsForGoal(goalTransactions, goal.id) / activeDays;

  if (averagePerDay <= 0) {
    return null;
  }

  const daysNeeded = Math.ceil(remaining / averagePerDay);
  return addDays(startOfDay(new Date()), daysNeeded).toISOString();
};

export const buildStreakStats = (goal: Goal, transactions: Transaction[]): StreakStats => {
  const goalTransactions = transactions.filter((transaction) => transaction.goalId === goal.id);
  const uniqueDays = [...new Set(goalTransactions.map((transaction) => toDateKey(transaction.date)))].sort();
  let longest = 0;
  let currentRun = 0;
  let previousDay: string | null = null;

  uniqueDays.forEach((day) => {
    if (!previousDay) {
      currentRun = 1;
      longest = 1;
      previousDay = day;
      return;
    }

    const diff = differenceInCalendarDays(parseISO(day + 'T00:00:00'), parseISO(previousDay + 'T00:00:00'));
    currentRun = diff === 1 ? currentRun + 1 : 1;
    longest = Math.max(longest, currentRun);
    previousDay = day;
  });

  const createdAt = parseISO(goal.createdAt);
  const allDays = eachDayOfInterval({ start: startOfDay(createdAt), end: startOfDay(new Date()) });
  const current = calculateDailyStreak(goalTransactions.map((transaction) => transaction.date));
  const weeklyPace = goalTransactions
    .filter((transaction) => differenceInCalendarDays(new Date(), parseISO(transaction.date)) <= 7)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyPace = goalTransactions
    .filter((transaction) => differenceInCalendarDays(new Date(), parseISO(transaction.date)) <= 30)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    current,
    longest,
    totalDepositDays: uniqueDays.length,
    daysSinceGoalCreated: allDays.length,
    weeklyPace,
    monthlyPace,
  };
};


export const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized.padStart(6, '0').slice(0, 6);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};

export const calculatePaceDrift = (goal: Goal, transactions: Transaction[]): { expectedNow: number; delta: number } => {
  const createdAt = parseISO(goal.createdAt);
  const daysAlive = Math.max(differenceInCalendarDays(new Date(), createdAt) + 1, 1);
  const daily = goal.recommendedDailyAmount ?? Math.ceil(goal.targetAmount / 90);
  const expectedNow = Math.max(0, daily * daysAlive);
  const delta = goal.currentAmount - expectedNow;
  return { expectedNow, delta };
};


