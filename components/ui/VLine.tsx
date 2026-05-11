import React from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/design';

export function VLine() {
  return (
    <View
      style={{
        width: 2,
        height: 26,
        backgroundColor: Colors.t1,
        marginHorizontal: 22,
        marginTop: 10,
        marginBottom: 2,
        borderRadius: 1,
      }}
    />
  );
}
