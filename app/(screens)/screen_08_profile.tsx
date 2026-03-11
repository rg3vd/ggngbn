import React, { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';

import BottomNavBar from '@/components/BottomNavBar';
import CommsFloatingPing from '@/components/CommsFloatingPing';
import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { bottomNavRoutes } from '@/constants';
import { triggerLightHaptic } from '@/services';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies } from '@/theme';

const quickLinks = [
  { label: 'Contracts', route: '/(screens)/screen_32_contracts' },
  { label: 'Missions', route: '/(screens)/screen_33_mission_routes' },
  { label: 'Risk Sim', route: '/(screens)/screen_31_risk_simulator' },
  { label: 'Notifications', route: '/(screens)/screen_15_notification_settings' },
  { label: 'Tutorial', route: '/(screens)/screen_17_tutorial' },
  { label: 'Backup', route: '/(screens)/screen_18_backup_restore' },
  { label: 'Currency', route: '/(screens)/screen_19_currency_converter' },
  { label: 'About', route: '/(screens)/screen_20_about' },
  { label: 'Themes', route: '/(screens)/screen_28_themes_store' },
  { label: 'Insights', route: '/(screens)/screen_29_insights' },
] as const;

export default function Screen08Profile() {
  const nickname = useSettingsStore((state) => state.nickname);
  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const language = useSettingsStore((state) => state.language);
  const currency = useSettingsStore((state) => state.currency);
  const setActiveTheme = useSettingsStore((state) => state.setActiveTheme);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setCurrency = useSettingsStore((state) => state.setCurrency);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>PROFILE</Text>
        <CyberpunkCard>
          <Text style={styles.nickname}>{nickname || 'AGENT'}</Text>
          <Text style={styles.meta}>Cyberpunk savings operative</Text>
        </CyberpunkCard>

        <CyberpunkCard>
          <Text style={styles.sectionTitle}>Accent Theme</Text>
          <View style={styles.rowWrap}>
            {['cyan', 'purple', 'pink', 'green'].map((item) => (
              <NeonChip key={item} isSelected={activeTheme === item} label={item} onPress={() => setActiveTheme(item as typeof activeTheme)} />
            ))}
          </View>
        </CyberpunkCard>

        <CyberpunkCard>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.rowWrap}>
            <NeonChip isSelected={language === 'uk'} label="Українська" onPress={() => setLanguage('uk')} />
            <NeonChip isSelected={language === 'en'} label="English" onPress={() => setLanguage('en')} />
          </View>
        </CyberpunkCard>

        <CyberpunkCard>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.rowWrap}>
            {['UAH', 'USD', 'EUR'].map((item) => <NeonChip key={item} isSelected={currency === item} label={item} onPress={() => setCurrency(item as typeof currency)} />)}
          </View>
        </CyberpunkCard>

        <CyberpunkCard>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sound</Text>
            <Switch onValueChange={setSoundEnabled} value={soundEnabled} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Haptics</Text>
            <Switch onValueChange={(value) => {
              setHapticsEnabled(value);
              void triggerLightHaptic();
            }} value={hapticsEnabled} />
          </View>
        </CyberpunkCard>

        <CyberpunkCard>
          <Text style={styles.sectionTitle}>Utility Hub</Text>
          <View style={styles.links}>
            {quickLinks.map((item) => (
              <NeonButton key={item.route} label={item.label} onPress={() => router.push(item.route)} />
            ))}
          </View>
          <NeonButton label="Archive" onPress={() => router.push('/(screens)/screen_16_archive')} />
        </CyberpunkCard>
      </ScrollView>
      <CommsFloatingPing />
      <BottomNavBar currentIndex={4} onPress={(index) => router.push(bottomNavRoutes[index])} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 16, paddingTop: 56, gap: 12 },
  content: { gap: 14, paddingBottom: 20 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  nickname: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 24, marginBottom: 6 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body },
  sectionTitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.accentBold, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1.2 },
  rowWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  switchLabel: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold, fontSize: 15 },
  links: { gap: 10, marginBottom: 10 },
});


