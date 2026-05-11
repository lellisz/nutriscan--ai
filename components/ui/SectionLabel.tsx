import React from 'react';
import { Text } from 'react-native';
import { Colors } from '@/constants/design';

interface SectionLabelProps {
  children: string;
  style?: object;
  noUppercase?: boolean;
}

export function SectionLabel({ children, style, noUppercase }: SectionLabelProps) {
  return (
    <Text
      style={[
        {
          fontSize: 11,
          letterSpacing: noUppercase ? 0.3 : 1.1,
          color: Colors.t4,
          marginBottom: 7,
          textTransform: noUppercase ? 'none' : 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
