import React from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/design';

interface ProgressBarProps {
  value: number;      // 0 a 1
  opacity?: number;
  height?: number;
}

export function ProgressBar({ value, opacity = 1, height = 1.5 }: ProgressBarProps) {
  const pct = `${Math.min(Math.max(value, 0), 1) * 100}%`;
  return (
    <View style={{ height, backgroundColor: Colors.c3, borderRadius: 1, overflow: 'hidden' }}>
      <View
        style={{
          height,
          width: pct as `${number}%`,
          backgroundColor: Colors.t1,
          borderRadius: 1,
          opacity,
        }}
      />
    </View>
  );
}
