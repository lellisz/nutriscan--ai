import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors } from '@/constants/design';

interface CardProps {
  children: React.ReactNode;
  highlight?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, highlight, style, onPress }: CardProps) {
  const content = (
    <>
      <View style={styles.topEdge} />
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          highlight && styles.highlight,
          style,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, highlight && styles.highlight, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.c1,
    borderWidth: 1,
    borderColor: Colors.b1,
    borderRadius: 18,
    marginHorizontal: 12,
    marginBottom: 7,
    padding: 16,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    borderColor: Colors.b2,
  },
  pressed: {
    opacity: 0.85,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: '14%',
    right: '14%',
    height: 0.5,
    backgroundColor: 'rgba(235,224,205,0.07)',
  },
});
