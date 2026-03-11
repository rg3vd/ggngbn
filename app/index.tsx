import { Redirect } from 'expo-router';

import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function Index() {
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  const briefingShown = useSettingsStore((state) => state.briefingShown);
  const goals = useGoalsStore((state) => state.goals);

  if (!onboardingComplete) {
    return <Redirect href="/(screens)/screen_00_onboarding" />;
  }

  if (!briefingShown) {
    return <Redirect href="/(screens)/screen_30_briefing" />;
  }

  if (goals.length === 0) {
    return <Redirect href="/(screens)/screen_02_goal_config" />;
  }

  return <Redirect href="/(screens)/screen_03_dashboard" />;
}
