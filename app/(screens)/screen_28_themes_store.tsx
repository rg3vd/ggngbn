import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonChip from '@/components/NeonChip';
import { playUnlockSound, triggerLightHaptic } from '@/services';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, baseColors, fontFamilies } from '@/theme';

const themes = [
  { key: 'cyan', title: 'Cyan Signal', unlock: 'Default issue', minAchievements: 0 },
  { key: 'purple', title: 'Purple Signal', unlock: 'Unlock 1 achievement', minAchievements: 1 },
  { key: 'pink', title: 'Pink Signal', unlock: 'Unlock 3 achievements', minAchievements: 3 },
  { key: 'green', title: 'Green Signal', unlock: 'Unlock 5 achievements', minAchievements: 5 },
] as const;

export default function Screen28ThemesStore() {
  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const setActiveTheme = useSettingsStore((state) => state.setActiveTheme);
  const crtEnabled = useSettingsStore((state) => state.visualFx.crtEnabled);
  const setCrtEnabled = useSettingsStore((state) => state.setCrtEnabled);
  const achievements = useAchievementsStore((state) => state.achievements);

  const accent = accentColorMap[activeTheme];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>THEMES STORE</Text>
      <Text style={styles.subtitle}>Unlocked achievements: {achievements.length}</Text>

      <CyberpunkCard borderColor={accent}>
        <Text style={styles.cardTitle}>PATCHES</Text>
        <Text style={styles.cardSubtitle}>Global visual mods for your vault UI.</Text>
        <View style={styles.patchRow}>
          <View style={styles.patchCopy}>
            <Text style={styles.patchTitle}>CRT SCANLINE</Text>
            <Text style={styles.patchDesc}>Subtle terminal scanlines + vignette overlay.</Text>
          </View>
          <NeonChip
            label={crtEnabled ? 'ON' : 'OFF'}
            isSelected={crtEnabled}
            onPress={() => {
              setCrtEnabled(!crtEnabled);
              void Promise.all([triggerLightHaptic(), playUnlockSound()]);
            }}
            color={accent}
          />
        </View>
      </CyberpunkCard>

      {themes.map((theme) => {
        const unlocked = achievements.length >= theme.minAchievements;
        return (
          <CyberpunkCard key={theme.key} borderColor={accentColorMap[theme.key]}>
            <Text style={styles.cardTitle}>{theme.title.toUpperCase()}</Text>
            <View style={styles.previewShell}>
              <View style={[styles.previewGlow, { borderColor: accentColorMap[theme.key], shadowColor: accentColorMap[theme.key] }]}>
                <Text style={[styles.previewTitle, { color: accentColorMap[theme.key] }]}>DASHBOARD</Text>
                <View style={[styles.previewBar, { backgroundColor: accentColorMap[theme.key] }]} />
                <View style={styles.previewMuted} />
                <View style={[styles.previewDot, { backgroundColor: accentColorMap[theme.key] }]} />
              </View>
            </View>
            <Text style={styles.unlock}>{theme.unlock}</Text>
            <NeonChip
              label={activeTheme === theme.key ? 'ACTIVE' : unlocked ? 'ACTIVATE' : 'LOCKED'}
              isSelected={activeTheme === theme.key}
              onPress={() => {
                if (!unlocked) {
                  return;
                }
                setActiveTheme(theme.key);
                void Promise.all([triggerLightHaptic(), playUnlockSound()]);
              }}
              color={accentColorMap[theme.key]}
            />
          </CyberpunkCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22 },
  cardTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, marginBottom: 12 },
  cardSubtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 20, marginTop: -6, marginBottom: 10 },
  previewShell: { marginBottom: 12 },
  previewGlow: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(10,10,15,0.7)',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  previewTitle: { fontFamily: fontFamilies.headingBold, fontSize: 16, marginBottom: 12 },
  previewBar: { height: 14, borderRadius: 999, marginBottom: 10 },
  previewMuted: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
  previewDot: { width: 24, height: 24, borderRadius: 999 },
  unlock: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 10 },
  patchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  patchCopy: { flex: 1 },
  patchTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 14, letterSpacing: 1 },
  patchDesc: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 20, marginTop: 6 },
});
