import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { baseColors, fontFamilies } from '@/theme';

interface HologramProductProps {
  goalType: 'ps5' | 'monitor';
  progress: number;
  size: number;
}

const HologramProductComponent = ({ goalType, progress, size }: HologramProductProps) => {
  const normalizedProgress = Math.max(0.15, Math.min(progress, 1));
  const accent = goalType === 'ps5' ? baseColors.cyan : baseColors.purple;
  const label = goalType === 'ps5' ? 'PLAYSTATION_5' : 'ULTRAWIDE_MONITOR';

  return (
    <View style={[styles.shell, { width: size + 18, height: size + 18 }]}> 
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderColor: accent,
            shadowColor: accent,
            opacity: 0.5 + normalizedProgress * 0.5,
          },
        ]}
      >
        <View style={[styles.inner, { borderColor: accent }]}> 
          <View style={[styles.scanline, { backgroundColor: `${accent}55` }]} />
          <View style={[styles.grid, { borderColor: `${accent}35` }]} />
          <Text style={[styles.kicker, { color: accent }]}>TARGET_OBJECT</Text>
          <Text style={[styles.glyph, { color: accent }]}>{goalType === 'ps5' ? 'PS5' : 'MON'}</Text>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.percent}>{Math.round(progress * 100)}% SYNCHRONIZED</Text>
        </View>
      </View>
      <View style={[styles.orbit, { borderColor: `${accent}45`, width: size + 14, height: size + 14, borderRadius: size }]} />
    </View>
  );
};

export const HologramProduct = React.memo(HologramProductComponent);
export default HologramProduct;

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  frame: {
    borderWidth: 1.5,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowOpacity: 0.36,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  inner: {
    width: '80%',
    height: '80%',
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,10,15,0.82)',
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '48%',
    height: 1,
  },
  grid: {
    position: 'absolute',
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
    borderWidth: 1,
    borderRadius: 12,
    opacity: 0.3,
  },
  kicker: {
    fontFamily: fontFamilies.accentBold,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  glyph: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    letterSpacing: 2,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 10,
    color: baseColors.textSecondary,
    letterSpacing: 1.1,
  },
  percent: {
    fontFamily: fontFamilies.accentBold,
    color: baseColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1.2,
  },
});


