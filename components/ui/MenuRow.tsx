import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@/constants/design';
import { Toggle } from '@/components/ui/Toggle';

interface MenuRowProps {
  iconBg?: string;
  iconElement?: React.ReactNode;
  title: string;
  desc?: string;
  rightElement?: 'toggle' | 'chevron' | 'badge';
  badgeText?: string;
  toggleValue?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  isPro?: boolean;
  isLast?: boolean;
}

export function MenuRow({
  iconBg,
  iconElement,
  title,
  desc,
  rightElement,
  badgeText,
  toggleValue = false,
  onToggle,
  onPress,
  isPro = false,
  isLast = false,
}: MenuRowProps) {
  const resolvedIconBg = iconBg ?? Colors.c2;

  return (
    <Pressable
      onPress={rightElement === 'toggle' ? onToggle : onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && { backgroundColor: Colors.c2 },
      ]}
    >
      {/* Icon box */}
      {iconElement !== undefined && (
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isPro ? Colors.c3 : resolvedIconBg,
              borderColor: isPro ? Colors.b2 : Colors.b1,
            },
          ]}
        >
          {iconElement}
        </View>
      )}

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {desc ? (
          <Text style={styles.desc} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
      </View>

      {/* Right element */}
      {rightElement === 'toggle' && onToggle && (
        <Toggle value={toggleValue} onToggle={onToggle} />
      )}

      {rightElement === 'chevron' && (
        <Text style={styles.chevron}>›</Text>
      )}

      {rightElement === 'badge' && badgeText && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.b1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.t1,
  },
  desc: {
    fontSize: 11,
    color: Colors.t3,
  },
  chevron: {
    fontSize: 16,
    color: Colors.t5,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: Colors.c3,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 9,
  },
  badgeText: {
    fontSize: 9,
    color: Colors.t2,
    fontWeight: '500',
  },
});
