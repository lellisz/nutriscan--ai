import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Filter, FeTurbulence, FeColorMatrix, Rect, Defs } from 'react-native-svg';

interface NoiseBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  opacity?: number;
}

export function NoiseBackground({ children, style, opacity = 0.04 }: NoiseBackgroundProps) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {/* SVG grain texture via feTurbulence */}
      <Svg
        width="100%"
        height="100%"
        style={[StyleSheet.absoluteFill, { opacity }]}
      >
        <Defs>
          <Filter id="noise" x="0%" y="0%" width="100%" height="100%">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency={0.65}
              numOctaves={3}
              stitchTiles="stitch"
            />
            <FeColorMatrix type="saturate" values="0" />
          </Filter>
        </Defs>
        <Rect width="100%" height="100%" filter="url(#noise)" />
      </Svg>
      {children}
    </View>
  );
}
