import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Colors, fonts, fontSizes } from '@/constants/design';

interface AnimatedBarProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  color?: string;
  delay?: number;
}

export function AnimatedBar({
  label,
  value,
  target,
  unit,
  color = Colors.t1,
  delay = 0,
}: AnimatedBarProps) {
  const progress = useSharedValue(0);
  const pct = target > 0 ? Math.min(value / target, 1) : 0;

  useEffect(() => {
    const t = setTimeout(() => {
      progress.value = withTiming(pct, {
        duration: 700,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, delay);
    return () => {
      clearTimeout(t);
      cancelAnimation(progress);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, delay]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
    // Smooth color transition from track color to gold at ≥95%
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.95, 1],
      [color, color, Colors.gold]
    ),
  }));

  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{
          fontFamily: fonts.sansLight,
          fontSize: 9,
          color: Colors.t4,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={{
            fontFamily: fonts.monoLight,
            fontSize: fontSizes.sm,
            color: pct >= 1 ? Colors.gold : Colors.t1,
            fontVariant: ['tabular-nums'],
          }}>
            {Math.round(value).toLocaleString('pt-BR')}
          </Text>
          <Text style={{ fontFamily: fonts.sansLight, fontSize: 9, color: Colors.t4 }}>
            / {target.toLocaleString('pt-BR')} {unit}
          </Text>
        </View>
      </View>

      <View style={{ height: 3, backgroundColor: Colors.c3, borderRadius: 1.5, overflow: 'hidden' }}>
        <Animated.View style={[{ height: 3, borderRadius: 1.5 }, animStyle]} />
      </View>
    </View>
  );
}
