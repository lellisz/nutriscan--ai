/**
 * Web shim for react-native-reanimated.
 * Strips entering/exiting/layout props (they don't work on web) and renders normally.
 */
import React from "react";
import { View, Text, ScrollView, FlatList, Image } from "react-native";

type AnimatedProps = {
  entering?: any;
  exiting?: any;
  layout?: any;
  [key: string]: any;
};

function strip({ entering, exiting, layout, ...props }: AnimatedProps) {
  return props;
}

const AnimatedView = (props: AnimatedProps) => <View {...strip(props)} />;
const AnimatedText = (props: AnimatedProps) => <Text {...strip(props)} />;
const AnimatedScrollView = (props: AnimatedProps) => <ScrollView {...strip(props)} />;
const AnimatedFlatList = (props: AnimatedProps) => <FlatList {...(strip(props) as any)} />;
const AnimatedImage = (props: AnimatedProps) => <Image {...strip(props)} />;

function createAnimatedComponent(Component: React.ComponentType<any>) {
  return (props: AnimatedProps) => <Component {...strip(props)} />;
}

const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  Image: AnimatedImage,
  createAnimatedComponent,
};

export default Animated;

// Animation stubs — all no-ops on web
const noop = () => noopChain;
const noopChain: any = new Proxy(
  {},
  { get: () => noop, apply: () => undefined }
);

export const FadeIn = noopChain;
export const FadeOut = noopChain;
export const FadeInDown = noopChain;
export const FadeInUp = noopChain;
export const FadeOutDown = noopChain;
export const FadeOutUp = noopChain;
export const SlideInDown = noopChain;
export const SlideInUp = noopChain;
export const SlideOutDown = noopChain;
export const SlideOutUp = noopChain;
export const ZoomIn = noopChain;
export const ZoomOut = noopChain;
export const BounceIn = noopChain;
export const BounceOut = noopChain;
export const Layout = noopChain;
export const LinearTransition = noopChain;

export const useSharedValue = (v: any) => ({ value: v });
export const useAnimatedStyle = (fn: () => any) => {
  try { return fn(); } catch { return {}; }
};
export const useDerivedValue = (fn: () => any) => ({ value: fn() });
export const useAnimatedScrollHandler = () => ({});
export const useAnimatedRef = () => React.createRef();
export const useAnimatedGestureHandler = () => ({});
export const withSpring = (v: any) => v;
export const withTiming = (v: any) => v;
export const withDelay = (_d: any, v: any) => v;
export const withSequence = (...args: any[]) => args[args.length - 1];
export const withRepeat = (v: any) => v;
export const cancelAnimation = () => {};
export const runOnJS = (fn: any) => fn;
export const runOnUI = (fn: any) => fn;
export const interpolate = (_v: any, _i: any[], o: any[]) => o[0];
export const interpolateColor = (_v: any, _i: any[], o: any[]) => o[0];
export const Easing = { linear: (t: any) => t, ease: (t: any) => t, bezier: () => (t: any) => t, in: (e: any) => e, out: (e: any) => e, inOut: (e: any) => e };
export const Extrapolate = { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" };
export const ExtrapolationType = Extrapolate;
