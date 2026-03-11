import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import CyberpunkCard from '@/components/CyberpunkCard';
import DigitalRain from '@/components/DigitalRain';
import GlitchText from '@/components/GlitchText';
import HologramProduct from '@/components/HologramProduct';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { triggerLightHaptic } from '@/services';
import { useSettingsStore } from '@/store/settingsStore';
import { GoalType } from '@/types';
import { baseColors, fontFamilies } from '@/theme';

const goalOptions: Array<{ key: GoalType | 'both'; label: string; value: GoalType[] }> = [
  { key: 'ps5', label: 'PS5', value: ['ps5'] },
  { key: 'monitor', label: 'Monitor', value: ['monitor'] },
  { key: 'both', label: 'Both', value: ['ps5', 'monitor'] },
];

export default function Screen00Onboarding() {
  const { t } = useTranslation();
  const nickname = useSettingsStore((state) => state.nickname);
  const language = useSettingsStore((state) => state.language);
  const selectedGoalTypes = useSettingsStore((state) => state.selectedGoalTypes);
  const setNickname = useSettingsStore((state) => state.setNickname);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setSelectedGoalTypes = useSettingsStore((state) => state.setSelectedGoalTypes);
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);
  const [step, setStep] = useState(0);

  const selectedGoalKey = useMemo(() => {
    if (selectedGoalTypes.length === 2) {
      return 'both';
    }
    return selectedGoalTypes[0] ?? 'ps5';
  }, [selectedGoalTypes]);

  const canContinue = step === 0 || step === 2 || nickname.trim().length > 0;

  return (
    <View style={styles.screen}>
      <DigitalRain opacity={0.12} />
      <View style={styles.content}>
        <GlitchText text={t('onboarding.title')} style={styles.title} />
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
        <Text style={styles.progress}>Step {step + 1} / 3</Text>

        {step === 0 ? (
          <CyberpunkCard>
            <Text style={styles.sectionLabel}>{t('onboarding.chooseLanguage')}</Text>
            <View style={styles.row}>
              <NeonChip label="Українська" isSelected={language === 'uk'} onPress={() => setLanguage('uk')} />
              <NeonChip label="English" isSelected={language === 'en'} onPress={() => setLanguage('en')} />
            </View>
            <View style={styles.previewRow}>
              <HologramProduct goalType="ps5" progress={0.35} size={120} />
              <HologramProduct goalType="monitor" progress={0.42} size={120} />
            </View>
          </CyberpunkCard>
        ) : null}

        {step === 1 ? (
          <CyberpunkCard>
            <Text style={styles.sectionLabel}>Agent Name</Text>
            <TextInput
              onChangeText={setNickname}
              placeholder={t('onboarding.nicknamePlaceholder')}
              placeholderTextColor={baseColors.textMuted}
              style={styles.input}
              value={nickname}
            />
            <Text style={styles.helper}>Your codename appears in the mission briefing and victory flow.</Text>
          </CyberpunkCard>
        ) : null}

        {step === 2 ? (
          <CyberpunkCard>
            <Text style={styles.sectionLabel}>{t('onboarding.chooseGoal')}</Text>
            <View style={styles.column}>
              {goalOptions.map((option) => (
                <NeonChip
                  key={option.key}
                  label={option.label}
                  isSelected={selectedGoalKey === option.key}
                  onPress={() => setSelectedGoalTypes(option.value)}
                />
              ))}
            </View>
            <Text style={styles.helper}>If you choose both, the next screen will ask you to configure both missions before launch.</Text>
          </CyberpunkCard>
        ) : null}

        <View style={styles.footerRow}>
          {step > 0 ? <NeonButton label={t('common.back')} onPress={() => setStep((value) => value - 1)} /> : null}
          <NeonButton
            label={step === 2 ? t('common.continue') : 'Next'}
            onPress={() => {
              if (!canContinue) {
                return;
              }
              void triggerLightHaptic();
              if (step === 2) {
                setOnboardingComplete(true);
                router.replace('/(screens)/screen_02_goal_config');
                return;
              }
              setStep((value) => value + 1);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 72, gap: 18 },
  title: { fontSize: 34, color: baseColors.textPrimary, letterSpacing: 2 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
  progress: { color: baseColors.cyan, fontFamily: fontFamilies.accentBold, letterSpacing: 1.2 },
  sectionLabel: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  row: { flexDirection: 'row', gap: 10 },
  column: { gap: 10 },
  previewRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, color: baseColors.textPrimary, fontFamily: fontFamilies.body, backgroundColor: 'rgba(10,10,15,0.75)', marginBottom: 10 },
  helper: { color: baseColors.textMuted, fontFamily: fontFamilies.body, lineHeight: 20 },
  footerRow: { marginTop: 'auto', gap: 12 },
});
