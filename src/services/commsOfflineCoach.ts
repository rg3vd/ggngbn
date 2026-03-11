import { differenceInCalendarDays, parseISO } from 'date-fns';

import { Goal, PriceSourceState, Transaction } from '@/types';
import { calculateForecastDate, calculateGoalProgress, calculatePaceDrift, formatCurrencyPrivacy, toDateKey } from '@/utils';

export interface CommsOfflineContext {
  goals: Goal[];
  transactions: Transaction[];
  activeGoalId: string | null;
  currency: string;
  privacyMode: 'blackout' | 'full';
  priceSources: PriceSourceState[];
  contractTier?: string | null;
  shields?: number | null;
}

export interface CommsOfflineReply {
  text: string;
  actions: string[];
  capsule: string;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const computeConfidence = (transactions: Transaction[], goalId: string): number => {
  const now = new Date();
  const last14 = transactions.filter((t) => t.goalId === goalId && differenceInCalendarDays(now, parseISO(t.date)) <= 13);
  const dayTotals: Record<string, number> = {};
  last14.forEach((t) => {
    const key = toDateKey(t.date);
    dayTotals[key] = (dayTotals[key] ?? 0) + t.amount;
  });
  const values = Object.values(dayTotals);
  const depositDays = values.length;
  const mean = values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.length === 0 ? 0 : values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  const volatility = mean > 0 ? std / mean : 0.9;
  const base = clamp(depositDays / 10, 0.05, 1);
  const penalty = clamp(volatility, 0, 0.7);
  return clamp(base * (1 - penalty), 0.1, 0.95);
};

const summarizePriceNode = (sources: PriceSourceState[]): { best: number | null; stale: boolean; errors: number } => {
  const lastTimes = sources.map((source) => (source.last?.fetchedAt ? Date.parse(source.last.fetchedAt) : 0)).filter((t) => t > 0);
  const newest = lastTimes.length ? Math.max(...lastTimes) : 0;
  const best = sources
    .map((s) => (typeof s.last?.priceUAH === 'number' ? s.last.priceUAH : null))
    .filter((v): v is number => typeof v === 'number');
  const errors = sources.filter((s) => Boolean(s.lastError)).length;
  const stale = newest === 0 ? true : Date.now() - newest > 12 * 60 * 60 * 1000;
  return { best: best.length ? Math.min(...best) : null, stale, errors };
};

export const buildCommsCapsule = (ctx: CommsOfflineContext, goal: Goal | null): string => {
  if (!goal) {
    return 'CAPSULE: NO_ACTIVE_GOAL';
  }

  const progressPct = Math.round(calculateGoalProgress(goal) * 100);
  const drift = calculatePaceDrift(goal, ctx.transactions);
  const driftLabel = drift.delta < 0 ? 'BEHIND' : 'AHEAD';
  const driftAbs = formatCurrencyPrivacy(Math.abs(drift.delta), ctx.currency, ctx.privacyMode);
  const confidence = Math.round(computeConfidence(ctx.transactions, goal.id) * 100);
  const price = summarizePriceNode(ctx.priceSources);
  const priceBest = price.best === null ? '—' : formatCurrencyPrivacy(price.best, 'UAH', ctx.privacyMode);
  const priceStatus = price.stale ? 'STALE' : 'LIVE';

  const tier = (ctx.contractTier ?? goal.mode).toString().toUpperCase();
  const shields = typeof ctx.shields === 'number' ? ctx.shields : 0;

  return [
    'CONTEXT CAPSULE',
    `GOAL: ${goal.name}`,
    `PROGRESS: ${progressPct}%`,
    `DRIFT: ${driftLabel} (${driftAbs})`,
    `CONFIDENCE: ${confidence}%`,
    `CONTRACT: ${tier} | SHIELDS: ${shields}`,
    `PRICE NODE: ${ctx.priceSources.length} SRC | BEST: ${priceBest} | ${priceStatus} | ERR: ${price.errors}`,
  ].join('\n');
};

export const buildOfflineCoachReply = (input: string, ctx: CommsOfflineContext): CommsOfflineReply => {
  const trimmed = input.trim();
  const goals = ctx.goals.filter((g) => !g.archived);
  const active = ctx.activeGoalId ? goals.find((g) => g.id === ctx.activeGoalId) ?? null : null;
  const goal = active ?? goals[0] ?? null;

  const capsule = buildCommsCapsule(ctx, goal);

  if (!goal) {
    return {
      capsule,
      text: [
        'Канал відкрито, але ціль ще не задана.',
        'Створи перший TARGET, і я зможу розкладати дріфт, темп і ризики без моралі.',
        '',
        'Дії:',
        '- OPEN GOAL CONFIG',
      ].join('\n'),
      actions: ['OPEN GOAL CONFIG'],
    };
  }

  const progressPct = Math.round(calculateGoalProgress(goal) * 100);
  const drift = calculatePaceDrift(goal, ctx.transactions);
  const driftBehind = drift.delta < 0;
  const driftAbs = formatCurrencyPrivacy(Math.abs(drift.delta), ctx.currency, ctx.privacyMode);
  const confidence = Math.round(computeConfidence(ctx.transactions, goal.id) * 100);

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const daily = goal.recommendedDailyAmount ?? Math.ceil(goal.targetAmount / 90);

  const minMove = clamp(Math.ceil(remaining / 30), 1, remaining || 1);
  const comfortMove = clamp(daily, 1, remaining || 1);
  const catchUpMove = driftBehind ? clamp(daily + Math.ceil(Math.abs(drift.delta) / 7), 1, remaining || 1) : comfortMove;

  const minLabel = formatCurrencyPrivacy(minMove, ctx.currency, ctx.privacyMode);
  const comfortLabel = formatCurrencyPrivacy(comfortMove, ctx.currency, ctx.privacyMode);
  const catchUpLabel = formatCurrencyPrivacy(catchUpMove, ctx.currency, ctx.privacyMode);

  const forecast = calculateForecastDate(goal, ctx.transactions);
  const eta = forecast ? toDateKey(forecast) : '—';

  const price = summarizePriceNode(ctx.priceSources);
  const priceStatus = price.stale ? 'STALE SIGNAL' : 'LIVE SIGNAL';

  const header = [
    `Ок, я на зв’язку.`,
    `Твій TARGET зараз на ${progressPct}%.`,
    `Дріфт: ${driftBehind ? 'позаду' : 'попереду'} (${driftAbs}). Confidence: ${confidence}%.`,
    `ETA: ${eta}. Price Node: ${priceStatus}.`,
  ].join(' ');

  const advice = [
    'Сьогоднішній хід можна зробити без тиску. Обери рівень інтенсивності і підтверди дію в UI.',
    `MIN MOVE: ${minLabel} • COMFORT: ${comfortLabel} • CATCH-UP: ${catchUpLabel}`,
  ].join('\n');

  const actions = ['OPEN DASHBOARD', 'OPEN PRICE WATCH', 'SUGGEST TODAY MOVE'];

  return {
    capsule,
    actions,
    text: [
      header,
      '',
      advice,
      '',
      'Дії:',
      '- OPEN DASHBOARD',
      '- OPEN PRICE WATCH',
      '- SUGGEST TODAY MOVE',
    ].join('\n'),
  };
};