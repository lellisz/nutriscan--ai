import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/design';

interface DetailPanelProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function DetailPanel({ visible, onClose, title, children }: DetailPanelProps) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          easing: (t) => {
            // cubic-bezier(0.4, 0, 0.2, 1) approximation
            return t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2;
          },
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && translateX === undefined) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.wrapper]} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateX }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose} hitSlop={6}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.b1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.c2,
    borderWidth: 0.5,
    borderColor: Colors.b1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: Colors.t1,
    lineHeight: 24,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.t1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
});
