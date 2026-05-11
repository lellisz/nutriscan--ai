import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  scale?: number;
  haptic?: 'light' | 'medium' | 'none';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function PressableScale({
  children,
  onPress,
  scale = 0.96,
  haptic = 'light',
  style,
  disabled,
}: PressableScaleProps) {
  const pressed = useSharedValue(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(pressed.value ? scale : 1, {
          damping: 15,
          stiffness: 300,
        }),
      },
    ],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
        onPress={() => {
          if (disabled) return;
          if (haptic !== 'none') {
            Haptics.impactAsync(
              haptic === 'medium'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
            );
          }
          onPress?.();
        }}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
