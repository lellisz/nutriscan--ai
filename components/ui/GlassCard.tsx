import React from 'react';
import { View, Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  style?: StyleProp<ViewStyle>;
}

const BASE_STYLE: ViewStyle = {
  borderRadius: 2,
  borderWidth: 0.5,
  borderColor: 'rgba(240,238,255,0.10)',
  overflow: 'hidden',
};

export function GlassCard({
  children,
  intensity = 20,
  tint = 'dark',
  style,
}: GlassCardProps) {
  if (Platform.OS === 'android') {
    return (
      <View style={[BASE_STYLE, { backgroundColor: 'rgba(13,12,26,0.88)' }, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={[BASE_STYLE, style]}>
      {children}
    </BlurView>
  );
}
