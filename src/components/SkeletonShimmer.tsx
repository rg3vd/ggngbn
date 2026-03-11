import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';



interface SkeletonShimmerProps {
  width: number;
  height: number;
  borderRadius?: number;
}

const SkeletonShimmerComponent = ({ width, height, borderRadius = 8 }: SkeletonShimmerProps) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
      shimmerValue.stopAnimation();
    };
  }, [shimmerValue]);

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.overlay,
          {
            borderRadius,
            opacity: shimmerValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 0.9],
            }),
          },
        ]}
      />
    </View>
  );
};

export const SkeletonShimmer = React.memo(SkeletonShimmerComponent);
export default SkeletonShimmer;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 43, 0.8)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
});
