import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  current: number;
  goal: number;
  size?: number;
  color?: string;
  showLabel?: boolean;
}

export const CalorieRing = React.memo(function CalorieRing({ current, goal, size = 120, color, showLabel = true }: CalorieRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const rawPct = goal > 0 ? Math.min(current / goal, 1) : 0;
  // mínimo visual 5% quando showLabel=false para o arco ser sempre visível
  const pct = !showLabel && rawPct === 0 ? 0.05 : rawPct;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={Colors.b1} strokeWidth={strokeWidth} fill="none"
        />
        {/* progress */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color ?? Colors.gold} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showLabel && (
        <View style={{ alignItems: "center" }}>
          <Text style={styles.value}>{Math.round(current)}</Text>
          <Text style={styles.goal}>/{goal} kcal</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  value: { fontFamily: fonts.monoLight, fontSize: fontSizes.xl, color: Colors.t1, lineHeight: 26 },
  goal: { fontFamily: fonts.sansLight, fontSize: 9, color: Colors.t3, letterSpacing: 1 },
});
