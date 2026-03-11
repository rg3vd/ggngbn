import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, baseColors, fontFamilies, shadows } from '@/theme';

interface NeonChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
}

const NeonChipComponent = ({ label, isSelected, onPress, color }: NeonChipProps) => {
  const accentTheme = useSettingsStore((state) => state.activeTheme);
  const resolvedColor = color ?? accentColorMap[accentTheme];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: resolvedColor,
          backgroundColor: isSelected ? 'rgba(10, 10, 15, 0.92)' : 'rgba(19, 19, 32, 0.72)',
          shadowColor: resolvedColor,
        },
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: isSelected ? resolvedColor : baseColors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
};

export const NeonChip = React.memo(NeonChipComponent);
export default NeonChip;

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadows.soft,
  },
  selected: {
    ...shadows.neon,
  },
  pressed: {
    opacity: 0.86,
  },
  label: {
    fontFamily: fontFamilies.accent,
    fontSize: 13,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
