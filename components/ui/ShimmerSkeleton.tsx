import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/design';

interface ShimmerSkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
}

export function ShimmerSkeleton({ width, height, borderRadius = 2 }: ShimmerSkeletonProps) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration: 1200, easing: Easing.linear }),
      -1,
    );
  }, [width]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ width, height, borderRadius, backgroundColor: Colors.c1, overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(240,238,255,0.08)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, width }}
        />
      </Animated.View>
    </View>
  );
}
