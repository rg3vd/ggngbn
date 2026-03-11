import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, fontFamilies, shadows } from '@/theme';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  isLoading?: boolean;
  width?: number;
}

const NeonButtonComponent = ({ label, onPress, color, isLoading = false, width }: NeonButtonProps) => {
  const accentTheme = useSettingsStore((state) => state.activeTheme);
  const resolvedColor = color ?? accentColorMap[accentTheme];
  const dynamicStyle: ViewStyle = {
    width,
    borderColor: resolvedColor,
    shadowColor: resolvedColor,
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, dynamicStyle, pressed && styles.buttonPressed, isLoading && styles.buttonDisabled]}
    >
      {isLoading ? (
        <ActivityIndicator color={resolvedColor} />
      ) : (
        <Text style={[styles.label, { color: resolvedColor }]}>{label}</Text>
      )}
    </Pressable>
  );
};

export const NeonButton = React.memo(NeonButtonComponent);
export default NeonButton;

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderWidth: 1.5,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...shadows.neon,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  label: {
    fontFamily: fontFamilies.accentBold,
    fontSize: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
