import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { playNavigationSound } from '@/services/audio';
import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, baseColors, fontFamilies } from '@/theme';

interface BottomNavBarProps {
  currentIndex: number;
  onPress: (index: number) => void;
}

const items = [
  { key: 'dashboard', icon: 'grid-outline', label: 'Dash' },
  { key: 'analytics', icon: 'stats-chart-outline', label: 'Stats' },
  { key: 'history', icon: 'time-outline', label: 'History' },
  { key: 'achievements', icon: 'trophy-outline', label: 'Badges' },
  { key: 'profile', icon: 'person-outline', label: 'Profile' },
  { key: 'comms', icon: 'chatbubbles-outline', label: 'Comms' },
] as const;

const BottomNavBarComponent = ({ currentIndex, onPress }: BottomNavBarProps) => {
  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const accent = accentColorMap[activeTheme];

  return (
    <View style={styles.wrapper}>
      {items.map((item, index) => {
        const active = index === currentIndex;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => { onPress(index); void playNavigationSound(); }}
            style={[styles.item, active && { borderColor: accent, shadowColor: accent }]}
          >
            <Ionicons color={active ? accent : baseColors.textMuted} name={item.icon} size={19} />
            <Text style={[styles.label, { color: active ? accent : baseColors.textMuted }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const BottomNavBar = React.memo(BottomNavBarComponent);
export default BottomNavBar;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(19,19,32,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  item: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: fontFamilies.accent,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
