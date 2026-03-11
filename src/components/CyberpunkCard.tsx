import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import NeonSparklines from './NeonSparklines';
import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, shadows } from '@/theme';

interface CyberpunkCardProps {
  children: React.ReactNode;
  borderColor?: string;
  onPress?: () => void;
  padding?: number;
  showSparklines?: boolean;
}

const CyberpunkCardComponent = ({
  children,
  borderColor,
  onPress,
  padding = 16,
  showSparklines = true,
}: CyberpunkCardProps) => {
  const accentTheme = useSettingsStore((state) => state.activeTheme);
  const resolvedColor = borderColor ?? accentColorMap[accentTheme];

  const content = (
    <View
      style={[
        styles.card,
        {
          borderColor: resolvedColor,
          shadowColor: resolvedColor,
          padding,
        },
      ]}
    >
      {showSparklines && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NeonSparklines color={resolvedColor} opacity={0.15} height={60} />
        </View>
      )}
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
};

export const CyberpunkCard = React.memo(CyberpunkCardComponent);
export default CyberpunkCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19, 19, 32, 0.92)',
    borderWidth: 1,
    borderRadius: 24,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
