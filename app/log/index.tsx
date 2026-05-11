import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";

type LogOption = {
  icon: string;
  title: string;
  subtitle: string;
  route: "/log/add" | "/log/camera" | "/log/voice" | "/log/restaurant";
};

const OPTIONS: LogOption[] = [
  { icon: "⌕", title: "Buscar alimento", subtitle: "Banco com 30+ itens", route: "/log/add" },
  { icon: "◎", title: "Escanear foto", subtitle: "IA identifica o prato", route: "/log/camera" },
  { icon: "●", title: "Registrar por voz", subtitle: "Fale o que comeu", route: "/log/voice" },
  { icon: "◫", title: "Modo restaurante", subtitle: "Restaurante + prato", route: "/log/restaurant" },
];

export default function LogIndexScreen() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Registrar refeição</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      <View style={styles.list}>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt.route} entering={FadeInDown.delay(i * 60).springify()}>
            <Pressable style={styles.row} onPress={() => router.push(opt.route)}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{opt.icon}</Text>
              </View>
              <View style={styles.textBox}>
                <Text style={styles.rowTitle}>{opt.title}</Text>
                <Text style={styles.rowSub}>{opt.subtitle}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b1,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backText: { fontFamily: fonts.sansLight, fontSize: 16, color: Colors.t3 },
  title: { fontFamily: fonts.serifLight, fontSize: fontSizes.xl, color: Colors.t1 },
  list: { paddingTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b1,
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.b2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 18, color: Colors.t3 },
  textBox: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: fonts.sansRegular, fontSize: fontSizes.sm, color: Colors.t1 },
  rowSub: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t4 },
  arrow: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t4 },
});
