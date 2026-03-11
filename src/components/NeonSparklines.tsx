import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Blur,
  Canvas,
  Line,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { baseColors } from '@/theme';

interface NeonSparklinesProps {
  color?: string;
  height?: number;
  opacity?: number;
}

const NeonSparklinesComponent = ({
  color = baseColors.cyan,
  height = 40,
  opacity = 0.6,
}: NeonSparklinesProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4000 }),
      -1,
      false
    );
  }, [progress]);

  const path = useMemo(() => {
    const skPath = Skia.Path.Make();
    const points = 12;
    const step = windowWidth / (points - 1);
    
    skPath.moveTo(0, height / 2);
    for (let i = 1; i < points; i++) {
        const x = i * step;
        const phase = i % 2 === 0 ? 1 : -1;
        const y = (height / 2) + (phase * (height / 5));
        
        // Use cubic to make it smoother
        const cp1x = x - (step / 2);
        const cp1y = (height / 2) + (phase * (height / 5));
        const cp2x = x - (step / 2);
        const cp2y = (height / 2) + (phase * (height / 5));

        skPath.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    return skPath;
  }, [height, windowWidth]);

  const animatedOpacity = useDerivedValue(() => {
    return progress.value > 0.5 ? (1 - progress.value) * opacity : progress.value * opacity;
  });

  const animatedStart = useDerivedValue(() => {
    return Math.max(0, progress.value - 0.2);
  });

  const animatedCoreStart = useDerivedValue(() => {
    return Math.max(0, progress.value - 0.1);
  });

  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background Trace */}
        <Path
          path={path}
          style="stroke"
          strokeWidth={1}
          color={color}
          opacity={opacity * 0.15}
        />
        
        {/* Animated Glow Pulse */}
        <Path
          path={path}
          style="stroke"
          strokeWidth={2.5}
          strokeJoin="round"
          strokeCap="round"
          color={color}
          opacity={animatedOpacity}
          start={animatedStart}
          end={progress}
        >
          <Blur blur={4} />
        </Path>
        
        {/* Animated Core Pulse */}
        <Path
          path={path}
          style="stroke"
          strokeWidth={1.5}
          strokeJoin="round"
          strokeCap="round"
          color={color}
          opacity={animatedOpacity}
          start={animatedCoreStart}
          end={progress}
        />
      </Canvas>
    </View>
  );
};

export const NeonSparklines = React.memo(NeonSparklinesComponent);
export default NeonSparklines;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});
