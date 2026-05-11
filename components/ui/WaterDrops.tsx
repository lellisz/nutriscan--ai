import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/design';

const DROP_PATH = 'M9 1C9 1 2 8 2 15C2 18.9 5.1 22 9 22C12.9 22 16 18.9 16 15C16 8 9 1 9 1Z';

interface DropProps {
  state: 'full' | 'partial' | 'empty';
}

function Drop({ state }: DropProps) {
  if (state === 'full') {
    return (
      <Svg width={17} height={22} viewBox="0 0 18 23">
        <Path d={DROP_PATH} fill={Colors.t1} />
      </Svg>
    );
  }
  if (state === 'partial') {
    return (
      <Svg width={17} height={22} viewBox="0 0 18 23">
        <Path d={DROP_PATH} fill={Colors.t1} opacity={0.7} />
      </Svg>
    );
  }
  // empty
  return (
    <Svg width={17} height={22} viewBox="0 0 18 23">
      <Path
        d={DROP_PATH}
        fill="none"
        stroke={Colors.c4}
        strokeWidth={1.2}
      />
    </Svg>
  );
}

interface WaterDropsProps {
  progress: number; // 0-1
}

export function WaterDrops({ progress }: WaterDropsProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const fullCount = Math.floor(clampedProgress * 8);
  const decimal = (clampedProgress * 8) - fullCount;
  const hasPartial = decimal > 0.1 && fullCount < 8;

  const drops = Array.from({ length: 8 }, (_, i) => {
    if (i < fullCount) return 'full' as const;
    if (i === fullCount && hasPartial) return 'partial' as const;
    return 'empty' as const;
  });

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {drops.map((state, i) => (
        <Drop key={i} state={state} />
      ))}
    </View>
  );
}
