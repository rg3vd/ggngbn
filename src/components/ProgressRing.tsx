import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { baseColors } from '@/theme';

interface ProgressRingProps {
  progress: number;
  size: number;
  color: string;
  children?: React.ReactNode;
}

const ProgressRingComponent = ({ progress, size, color, children }: ProgressRingProps) => {
  const strokeWidth = Math.max(10, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.max(0, Math.min(progress, 1));
  const dashOffset = circumference - circumference * normalizedProgress;
  const accentGradientId = `accent-${color.replace(/[^a-zA-Z0-9]/g, '')}-${size}`;
  const glowGradientId = `glow-${color.replace(/[^a-zA-Z0-9]/g, '')}-${size}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.outerGlow, { width: size + 12, height: size + 12, borderRadius: size, borderColor: color }]} />
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id={accentGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={baseColors.white} stopOpacity="0.95" />
            <Stop offset="35%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.45" />
          </LinearGradient>
          <LinearGradient id={glowGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.08" />
            <Stop offset="50%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.08" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth * 0.18}
          stroke={`url(#${glowGradientId})`}
          strokeWidth={strokeWidth * 1.5}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth * 0.72}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1.2}
          fill="none"
          strokeDasharray="3 8"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${accentGradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          originX={size / 2}
          originY={size / 2}
          rotation={-90}
        />
      </Svg>
      <View style={[styles.centerGlass, { width: size * 0.66, height: size * 0.66, borderRadius: size }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export const ProgressRing = React.memo(ProgressRingComponent);
export default ProgressRing;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.01)',
    shadowColor: baseColors.cyan,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  centerGlass: {
    position: 'absolute',
    backgroundColor: 'rgba(17,17,26,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
