import React, { useRef, useEffect } from 'react';
import { Pressable, Animated } from 'react-native';
import { Colors } from '@/constants/design';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function Toggle({ value, onToggle, disabled }: ToggleProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const bg = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [Colors.c4, Colors.t1],
  });

  const knobX = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [2, 18],
  });

  const knobColor = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [Colors.t3, Colors.bg],
  });

  return (
    <Pressable onPress={disabled ? undefined : onToggle} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Animated.View
        style={{
          width: 40,
          height: 24,
          borderRadius: 12,
          backgroundColor: bg,
          borderWidth: 0.5,
          borderColor: value ? 'transparent' : Colors.b1,
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Animated.View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: knobColor,
            position: 'absolute',
            left: knobX,
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
