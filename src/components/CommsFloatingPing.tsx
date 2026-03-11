import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, baseColors, fontFamilies, shadows } from '@/theme';

interface CommsFloatingPingProps {
  bottomOffset?: number;
}

const CommsFloatingPingComponent = ({ bottomOffset = 92 }: CommsFloatingPingProps) => {
  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const accent = accentColorMap[activeTheme];

  const [hidden, setHidden] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const hide = () => {
      setHidden(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 14, duration: 160, useNativeDriver: true }),
      ]).start();
    };

    const show = () => {
      setHidden(false);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    };

    const showSub = Keyboard.addListener('keyboardDidHide', show);
    const hideSub = Keyboard.addListener('keyboardDidShow', hide);

    return () => {
      showSub.remove();
      hideSub.remove();
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [opacity, translateY]);

  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'auto'}
      style={[styles.container, { bottom: bottomOffset, opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(screens)/screen_34_comms')}
        style={({ pressed }) => [
          styles.button,
          { borderColor: accent, shadowColor: accent },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons color={accent} name="chatbubbles-outline" size={18} />
        <Text style={[styles.label, { color: accent }]}>COMMS</Text>
      </Pressable>
    </Animated.View>
  );
};

export const CommsFloatingPing = React.memo(CommsFloatingPingComponent);
export default CommsFloatingPing;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(10,10,15,0.92)',
    ...shadows.neon,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontFamily: fontFamilies.accentBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: baseColors.textPrimary,
  },
});
