import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TextStyle, View } from 'react-native';

import { baseColors, fontFamilies } from '@/theme';

interface GlitchTextProps {
  text: string;
  style?: TextStyle;
  animate?: boolean;
}

const GlitchTextComponent = ({ text, style, animate = true }: GlitchTextProps) => {
  const offset = useRef(new Animated.Value(0)).current;
  const skew = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0.96)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!animate) {
      return undefined;
    }

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(offset, { toValue: 2.8, duration: 75, useNativeDriver: true }),
          Animated.timing(skew, { toValue: -1.5, duration: 75, useNativeDriver: true }),
          Animated.timing(flicker, { toValue: 0.84, duration: 75, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(offset, { toValue: -3.2, duration: 85, useNativeDriver: true }),
          Animated.timing(skew, { toValue: 1.8, duration: 85, useNativeDriver: true }),
          Animated.timing(flicker, { toValue: 1, duration: 85, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(offset, { toValue: 0, duration: 120, useNativeDriver: true }),
          Animated.timing(skew, { toValue: 0, duration: 120, useNativeDriver: true }),
          Animated.timing(flicker, { toValue: 0.97, duration: 120, useNativeDriver: true }),
        ]),
        Animated.delay(1350),
      ])
    );
    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
      offset.stopAnimation();
      skew.stopAnimation();
      flicker.stopAnimation();
    };
  }, [animate, flicker, offset, skew]);

  return (
    <Animated.View style={[styles.container, { opacity: flicker }]}> 
      <Animated.Text style={[styles.layer, styles.cyan, style, { transform: [{ translateX: offset }, { translateY: Animated.multiply(skew, 0.6) }] }]}>{text}</Animated.Text>
      <Animated.Text style={[styles.layer, styles.pink, style, { transform: [{ translateX: Animated.multiply(offset, -1) }, { translateY: Animated.multiply(skew, -0.45) }] }]}>{text}</Animated.Text>
      <Text style={[styles.main, style]}>{text}</Text>
      <View pointerEvents="none" style={styles.scanline} />
    </Animated.View>
  );
};

export const GlitchText = React.memo(GlitchTextComponent);
export default GlitchText;

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    fontFamily: fontFamilies.headingBold,
  },
  cyan: {
    color: 'rgba(0,245,255,0.58)',
    textShadowColor: 'rgba(0,245,255,0.4)',
    textShadowRadius: 14,
  },
  pink: {
    color: 'rgba(255,0,110,0.42)',
    textShadowColor: 'rgba(255,0,110,0.35)',
    textShadowRadius: 14,
  },
  main: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.headingBold,
    textShadowColor: 'rgba(255,255,255,0.12)',
    textShadowRadius: 10,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '56%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    opacity: 0.5,
  },
});
