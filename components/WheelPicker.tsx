import { useRef, useEffect } from "react";
import {
  Animated,
  ScrollView,
  View,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Colors, fonts, fontSizes } from "@/constants/design";

const ITEM_H = 48;
const VISIBLE = 5;
const PAD = ITEM_H * 2;

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
}

export function WheelPicker({ items, selectedIndex, onChange, width = 110 }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_H)).current;

  useEffect(() => {
    const y = selectedIndex * ITEM_H;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 50);
    scrollY.setValue(y);
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(Math.round(y / ITEM_H), items.length - 1));
    onChange(idx);
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
  }

  return (
    <View style={[styles.root, { width }]}>
      {/* Selection highlight band */}
      <View style={[styles.indicator, { pointerEvents: "none" }]} />

      <Animated.ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        contentContainerStyle={{ paddingVertical: PAD }}
        style={styles.scroll}
      >
        {items.map((label, idx) => {
          const offset = idx * ITEM_H;
          const inputRange = [
            offset - ITEM_H * 2,
            offset - ITEM_H,
            offset,
            offset + ITEM_H,
            offset + ITEM_H * 2,
          ];
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.06, 0.28, 1, 0.28, 0.06],
            extrapolate: "clamp",
          });
          const scale = scrollY.interpolate({
            inputRange: [offset - ITEM_H, offset, offset + ITEM_H],
            outputRange: [0.8, 1.05, 0.8],
            extrapolate: "clamp",
          });
          return (
            <Animated.View key={idx} style={[styles.item, { opacity }]}>
              <Animated.Text style={[styles.itemText, { transform: [{ scale }] }]}>
                {label}
              </Animated.Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: ITEM_H * VISIBLE,
    overflow: "hidden",
  },
  scroll: {
    height: ITEM_H * VISIBLE,
    width: "100%",
  },
  indicator: {
    position: "absolute",
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${Colors.gold}50`,
    backgroundColor: `${Colors.c1}50`,
    zIndex: 0,
  },
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.md,
    color: Colors.t1,
    letterSpacing: 0.5,
  },
});
