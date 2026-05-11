import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { Colors } from '@/constants/design';

interface AnimatedLogoProps {
  size?: number;
  color?: string;
  animate?: boolean;
}

function PraxisLogoSVG({ size, color }: { size: number; color: string }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Three nested triangles — outer, mid, inner
  const outer = `${cx},${s * 0.04} ${s * 0.04},${s * 0.96} ${s * 0.96},${s * 0.96}`;
  const mid   = `${cx},${s * 0.22} ${s * 0.18},${s * 0.80} ${s * 0.82},${s * 0.80}`;
  const inner = `${cx},${s * 0.38} ${s * 0.33},${s * 0.66} ${s * 0.67},${s * 0.66}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={outer} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" opacity={0.9} />
      <Polygon points={mid}   fill="none" stroke={color} strokeWidth={0.9} strokeLinejoin="round" opacity={0.65} />
      <Polygon points={inner} fill="none" stroke={color} strokeWidth={0.7} strokeLinejoin="round" opacity={0.40} />
      {/* Light point at apex */}
      <Polygon
        points={`${cx},${s * 0.04} ${cx - 1},${s * 0.10} ${cx + 1},${s * 0.10}`}
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

export function AnimatedLogo({ size = 52, color = Colors.t1, animate = true }: AnimatedLogoProps) {
  const scale      = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!animate) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.00, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 }),
      ),
      -1,
    );
  }, [animate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={animate ? animStyle : undefined}>
      <PraxisLogoSVG size={size} color={color} />
    </Animated.View>
  );
}
