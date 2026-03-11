import { Goal } from '@/types';

export interface WidgetSnapshot {
  title: string;
  subtitle: string;
  progressPercent: number;
  amountLabel: string;
  accent: string;
}

export const buildQuickWidgetSnapshot = (goal: Goal | null): WidgetSnapshot => {
  if (!goal) {
    return {
      title: 'Dream Piggy Bank',
      subtitle: 'Create your first goal',
      progressPercent: 0,
      amountLabel: '0 / 0',
      accent: '#00f5ff',
    };
  }

  const progress = goal.targetAmount <= 0 ? 0 : Math.min(goal.currentAmount / goal.targetAmount, 1);
  return {
    title: goal.name,
    subtitle: goal.mode.toUpperCase(),
    progressPercent: Math.round(progress * 100),
    amountLabel: `${goal.currentAmount} / ${goal.targetAmount}`,
    accent: goal.type === 'ps5' ? '#00f5ff' : '#bf00ff',
  };
};

export const serializeWidgetSnapshot = (snapshot: WidgetSnapshot): string => {
  return JSON.stringify(snapshot);
};

// FIXED: Native home widget integration requires platform-specific files outside this JS layer.
export const applyWidgetSnapshot = async (_snapshot: WidgetSnapshot): Promise<void> => {
  return Promise.resolve();
};
