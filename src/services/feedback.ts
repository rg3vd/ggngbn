import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/store/settingsStore';

const isHapticsEnabled = (): boolean => {
  return useSettingsStore.getState().hapticsEnabled;
};

export const triggerLightHaptic = async (): Promise<void> => {
  if (!isHapticsEnabled()) {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // no-op on unsupported platforms
  }
};

export const triggerMediumHaptic = async (): Promise<void> => {
  if (!isHapticsEnabled()) {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // no-op on unsupported platforms
  }
};

export const triggerHeavyHaptic = async (): Promise<void> => {
  if (!isHapticsEnabled()) {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // no-op on unsupported platforms
  }
};
