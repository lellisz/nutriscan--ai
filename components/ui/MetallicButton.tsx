import React from 'react';
import { Text, View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { fonts } from '@/constants/design';

interface MetallicButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function MetallicButton({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
}: MetallicButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: 52,
          borderRadius: 6,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isPrimary ? Colors.WH : 'transparent',
          borderWidth: isPrimary ? 0 : 0.5,
          borderColor: isPrimary ? undefined : Colors.B1,
          opacity: disabled ? 0.4 : pressed ? (isPrimary ? 0.85 : 0.7) : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.sansMedium,
          fontSize: 13,
          letterSpacing: 3,
          color: isPrimary ? Colors.BG : Colors.W2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
