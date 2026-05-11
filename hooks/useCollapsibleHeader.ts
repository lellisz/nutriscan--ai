import { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export function useCollapsibleHeader(triggerY = 80) {
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      headerOpacity.value = withTiming(y > triggerY ? 0 : 1, { duration: 200 });
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: withTiming(scrollY.value > triggerY ? -20 : 0, { duration: 200 }),
      },
    ],
  }));

  return { onScroll, headerStyle, scrollY };
}
