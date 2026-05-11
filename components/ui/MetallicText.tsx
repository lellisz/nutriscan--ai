import React from 'react';
import { Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '@/constants/design';
import { TYPE_SCALE, TypeScaleKey } from '@/constants/typography';

interface MetallicTextProps {
  children: string;
  scale?: TypeScaleKey;
  style?: TextStyle;
}

export function MetallicText({ children, scale = 'd4', style }: MetallicTextProps) {
  const typeStyle = TYPE_SCALE[scale];

  return (
    <MaskedView
      maskElement={
        <Text style={[typeStyle, { color: 'black', backgroundColor: 'transparent' }, style]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={GRADIENTS.metalWhite}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: typeStyle.lineHeight + 4 }}
      />
    </MaskedView>
  );
}
