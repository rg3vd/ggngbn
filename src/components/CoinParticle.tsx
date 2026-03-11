import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { baseColors } from '@/theme';

interface CoinParticleProps {
  trigger: boolean;
  onComplete?: () => void;
}

const CoinParticleComponent = ({ trigger, onComplete }: CoinParticleProps) => {
  const translateY = useRef(new Animated.Value(-24)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!trigger) {
      return undefined;
    }

    opacity.setValue(0);
    trailOpacity.setValue(0);
    scale.setValue(0.6);
    translateY.setValue(-24);
    translateX.setValue(0);
    animationRef.current = Animated.parallel([
      Animated.sequence([
        Animated.timing(trailOpacity, { toValue: 0.85, duration: 110, useNativeDriver: true }),
        Animated.timing(trailOpacity, { toValue: 0, duration: 540, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 260,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 88,
        duration: 680,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(translateX, { toValue: 8, duration: 150, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -6, duration: 150, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 4, duration: 140, useNativeDriver: true }),
      ]),
    ]);

    animationRef.current.start(() => {
      opacity.setValue(0);
      trailOpacity.setValue(0);
      onComplete?.();
    });

    return () => {
      animationRef.current?.stop();
      opacity.stopAnimation();
      trailOpacity.stopAnimation();
      scale.stopAnimation();
      translateY.stopAnimation();
      translateX.stopAnimation();
    };
  }, [onComplete, opacity, scale, trailOpacity, translateX, translateY, trigger]);

  if (!trigger) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.trail, { opacity: trailOpacity, transform: [{ translateY }] }]} />
      <Animated.View
        style={[
          styles.coin,
          {
            opacity,
            transform: [{ translateY }, { translateX }, { scale }],
          },
        ]}
      >
        <View style={styles.core} />
      </Animated.View>
    </View>
  );
};

export const CoinParticle = React.memo(CoinParticleComponent);
export default CoinParticle;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  trail: {
    position: 'absolute',
    top: 2,
    right: 20,
    width: 4,
    height: 48,
    borderRadius: 999,
    backgroundColor: 'rgba(255,209,102,0.45)',
    shadowColor: baseColors.warning,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  coin: {
    position: 'absolute',
    top: 0,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: baseColors.warning,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: baseColors.warning,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  core: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
});
