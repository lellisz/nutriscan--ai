import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';
import { Colors } from '@/constants/design';

interface FastingRingProps {
  progress: number;
  remainingFormatted: string;
  targetLabel: string;
}

const SIZE = 188;
const CX = 94;
const CY = 94;
const RING_R = 78;
const TWO_PI = 2 * Math.PI;
const CIRCUMFERENCE = TWO_PI * RING_R;

const ticks = Array.from({ length: 60 }, (_, i) => {
  const angle = (i / 60) * TWO_PI - Math.PI / 2;
  const isLarge = i % 5 === 0;
  const innerR = isLarge ? 68 : 72;
  const outerR = 80;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: CX + innerR * cos,
    y1: CY + innerR * sin,
    x2: CX + outerR * cos,
    y2: CY + outerR * sin,
    strokeWidth: isLarge ? 1.5 : 1.0,
  };
});

export function FastingRing({ progress, remainingFormatted, targetLabel }: FastingRingProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const fillLength = clampedProgress * CIRCUMFERENCE;
  const gapLength = CIRCUMFERENCE;

  const dotAngle = clampedProgress * TWO_PI - Math.PI / 2;
  const dotCx = CX + RING_R * Math.cos(dotAngle);
  const dotCy = CY + RING_R * Math.sin(dotAngle);

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute' }}>
        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <Line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={Colors.t5}
            strokeWidth={tick.strokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* Ring track */}
        <Circle
          cx={CX}
          cy={CY}
          r={RING_R}
          stroke={Colors.c3}
          strokeWidth={10}
          fill="none"
        />

        {/* Ring fill */}
        <Circle
          cx={CX}
          cy={CY}
          r={RING_R}
          stroke={Colors.t1}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${gapLength}`}
          transform={`rotate(-90 ${CX} ${CY})`}
        />

        {/* Dot at arc tip */}
        {clampedProgress > 0 && (
          <Circle
            cx={dotCx}
            cy={dotCy}
            r={5.5}
            fill={Colors.t1}
          />
        )}
      </Svg>

      {/* Center text */}
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 29,
            fontWeight: '700',
            color: Colors.t1,
            fontVariant: ['tabular-nums'],
            letterSpacing: -0.5,
          }}
        >
          {remainingFormatted}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: Colors.t3,
            marginTop: 3,
          }}
        >
          {targetLabel}
        </Text>
      </View>
    </View>
  );
}
