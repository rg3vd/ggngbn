import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

import { baseColors } from '@/theme';

interface CrtScanlineLayerProps {
  enabled?: boolean;
  accentColor?: string;
  dense?: boolean;
}

const CrtScanlineLayerComponent = ({ enabled = true, accentColor = baseColors.cyan, dense = false }: CrtScanlineLayerProps) => {
  const { height } = useWindowDimensions();
  const flicker = useRef(new Animated.Value(0.96)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const lineTops = useMemo(() => {
    const step = dense ? 5 : 6;
    const count = Math.max(24, Math.ceil(height / step));
    return Array.from({ length: count }, (_, index) => index * step);
  }, [dense, height]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.93, duration: 2200, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.99, duration: 1800, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.95, duration: 2400, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );

    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
      flicker.stopAnimation();
    };
  }, [enabled, flicker]);

  if (!enabled) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity: flicker }]}
    >
      <View style={styles.vignette} />
      <View style={[styles.edgeLeft, { backgroundColor: accentColor }]} />
      <View style={styles.edgeRight} />
      {lineTops.map((top, index) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={`${top}-${index}`}
          style={[
            styles.scanline,
            {
              top,
              opacity: index % 6 === 0 ? 0.09 : 0.045,
            },
          ]}
        />
      ))}
      <View style={styles.centerBloom} />
    </Animated.View>
  );
};

export const CrtScanlineLayer = React.memo(CrtScanlineLayerComponent);
export default CrtScanlineLayer;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 18,
    borderColor: 'rgba(0,0,0,0.28)',
  },
  centerBloom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  edgeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.06,
  },
  edgeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: baseColors.pink,
    opacity: 0.05,
  },
});
