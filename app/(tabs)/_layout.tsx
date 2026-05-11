import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, fonts } from "@/constants/design";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { IconHome, IconFasting, IconInsights, IconCoach, IconPhoto } from "@/components/ui/TabIcons";

// ─── DEFINIÇÃO DAS TABS ───────────────────────────────────────────────────────

// photoprog não aparece na barra — acessível via deep link ou perfil
const TABS = [
  { name: "index",    label: "INÍCIO",   Icon: IconHome     },
  { name: "fasting",  label: "JEJUM",    Icon: IconFasting  },
  { name: "scan",     label: "",         Icon: null         }, // tab central
  { name: "insights", label: "INSIGHTS", Icon: IconInsights },
  { name: "coach",    label: "COACH",    Icon: IconCoach    },
] as const;

// ─── CUSTOM TAB BAR ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={40}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      )}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null; // rota desconhecida — não renderiza
        const isScan = tab.name === "scan";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // ── Tab central (+) ──
        if (isScan) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.scanWrapper}
            >
              <View style={styles.scanBtn}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 5V19M5 12H19"
                    stroke={Colors.t1}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </Pressable>
          );
        }

        // ── Tab normal ──
        const { Icon, label } = tab as { Icon: React.ComponentType<{ active: boolean }>; label: string };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <Icon active={isFocused} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
            {isFocused && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="fasting" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="food" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="photoprog" />
    </Tabs>
  );
}

// ─── ESTILOS ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(7,7,13,0.98)',
    borderTopWidth: 0.5,
    borderTopColor: "rgba(240,238,255,0.07)",
    paddingTop: 10,
    paddingHorizontal: 4,
    alignItems: "flex-end",
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    paddingTop: 2,
  },
  tabLabel: {
    fontFamily: fonts.sansLight,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.t1,
    opacity: 0.28,
  },
  tabLabelActive: {
    opacity: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.t1,
    marginTop: 1,
  },
  scanWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  scanBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.c2,
    borderWidth: 1,
    borderColor: Colors.b2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -7,
  },
});
