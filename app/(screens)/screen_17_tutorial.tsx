import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import DigitalRain from '@/components/DigitalRain';
import GlitchText from '@/components/GlitchText';
import NeonButton from '@/components/NeonButton';
import { triggerLightHaptic } from '@/services';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';

const tutorialSteps = [
  'Create a goal and define your mission target.',
  'Use quick deposits or custom deposits to build momentum.',
  'Track streaks, achievements, and analytics to stay on pace.',
];

export default function Screen17Tutorial() {
  const [step, setStep] = useState(0);
  const setTutorialCompleted = useSettingsStore((state) => state.setTutorialCompleted);
  const isLast = step === tutorialSteps.length - 1;

  return (
    <View style={styles.screen}>
      <DigitalRain opacity={0.1} />
      <GlitchText text="SYSTEM TUTORIAL" style={styles.title} />
      <Text style={styles.step}>Step {step + 1} / {tutorialSteps.length}</Text>
      <Text style={styles.body}>{tutorialSteps[step]}</Text>
      <View style={styles.actions}>
        {step > 0 ? <NeonButton label="Back" onPress={() => setStep((value) => value - 1)} /> : null}
        <NeonButton
          label={isLast ? 'Finish' : 'Next'}
          onPress={() => {
            void triggerLightHaptic();
            if (isLast) {
              setTutorialCompleted(true);
              router.back();
              return;
            }
            setStep((value) => value + 1);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 20, paddingTop: 72, gap: 18 },
  title: { color: baseColors.textPrimary, fontSize: 28 },
  step: { color: baseColors.cyan, fontFamily: fontFamilies.accentBold, fontSize: 14, letterSpacing: 1.4 },
  body: { color: baseColors.textPrimary, fontFamily: fontFamilies.body, fontSize: 18, lineHeight: 28 },
  actions: { marginTop: 'auto', gap: 12 },
});
