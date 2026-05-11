import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/design';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingConfig {
  r: number;
  progress: number;
  opacity: number;
  delay: number;
}

function AnimatedRing({ r, progress, opacity, delay }: RingConfig) {
  const circumference = 2 * Math.PI * r;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      animatedProgress.value = withTiming(progress, {
        duration: 900,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [progress, delay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${animatedProgress.value * circumference} ${circumference}`,
  }));

  return (
    <>
      {/* Track */}
      <Circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke={Colors.c3}
        strokeWidth={7.5}
        transform="rotate(-90 50 50)"
      />
      {/* Fill */}
      <AnimatedCircle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke={Colors.t1}
        strokeWidth={7.5}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        opacity={opacity}
        animatedProps={animatedProps}
      />
    </>
  );
}

interface PraxisRingProps {
  scoreValue: number;     // 0-100
  proteinValue: number;   // 0-1
  hydrationValue: number; // 0-1
  label: string;
}

export function PraxisRing({ scoreValue, proteinValue, hydrationValue, label }: PraxisRingProps) {
  const scoreProgress = Math.min(Math.max(scoreValue / 100, 0), 1);

  return (
    <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <G>
          <AnimatedRing r={43} progress={scoreProgress}    opacity={1.0}  delay={50}  />
          <AnimatedRing r={32} progress={proteinValue}     opacity={0.52} delay={140} />
          <AnimatedRing r={21} progress={hydrationValue}   opacity={0.22} delay={230} />
        </G>
      </Svg>
      {/* Center label */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        pointerEvents="none"
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: Colors.t1,
            lineHeight: 22,
          }}
        >
          {Math.round(scoreValue)}
        </Text>
        <Text
          style={{
            fontSize: 8,
            color: Colors.t3,
            letterSpacing: 0.06 * 8,
            textTransform: 'lowercase',
            marginTop: 1,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
