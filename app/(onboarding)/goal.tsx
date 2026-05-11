import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { Goal, ActivityLevel, ACTIVITY_LABELS, GOAL_LABELS } from "@/types";
import { create } from "zustand";
import { WheelPicker } from "@/components/WheelPicker";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface GoalState {
  goal: Goal;
  activityLevel: ActivityLevel;
  setGoal: (g: Goal) => void;
  setActivityLevel: (a: ActivityLevel) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  goal: "maintain",
  activityLevel: "1.55",
  setGoal: (goal) => set({ goal }),
  setActivityLevel: (activityLevel) => set({ activityLevel }),
}));

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const GOALS: { value: Goal; desc: string }[] = [
  { value: "lose_weight", desc: "Reduzir gordura corporal com déficit calórico inteligente" },
  { value: "gain_muscle", desc: "Aumentar massa muscular com superávit calórico e proteína alta" },
  { value: "maintain", desc: "Manter composição corporal atual em equilíbrio" },
];

const ACTIVITY_LEVELS: ActivityLevel[] = ["1.2", "1.375", "1.55", "1.725", "1.9"];
const ACTIVITY_ITEMS = ACTIVITY_LEVELS.map((l) => ACTIVITY_LABELS[l]);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function GoalScreen() {
  const { width } = useWindowDimensions();
  const { goal, activityLevel, setGoal, setActivityLevel } = useGoalStore();

  const [activityIdx, setActivityIdx] = useState(
    () => Math.max(0, ACTIVITY_LEVELS.indexOf(activityLevel))
  );

  const pickerW = width - 64; // full width minus padding

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.springify()}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← VOLTAR</Text>
        </Pressable>

        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={[styles.dot, n <= 2 && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.step}>PASSO 2 DE 4</Text>
        <Text style={styles.title}>Seu objetivo</Text>
        <Text style={styles.subtitle}>Escolha o foco da sua jornada nutricional.</Text>

        {/* Goal cards */}
        <View style={styles.section}>
          {GOALS.map((g) => (
            <Pressable
              key={g.value}
              style={[styles.card, goal === g.value && styles.cardActive]}
              onPress={() => setGoal(g.value)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, goal === g.value && styles.cardTitleActive]}>
                  {GOAL_LABELS[g.value]}
                </Text>
                {goal === g.value && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={styles.cardDesc}>{g.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Activity level wheel */}
        <Text style={styles.sectionLabel}>NÍVEL DE ATIVIDADE</Text>
        <View style={[styles.activityPicker, { width: pickerW }]}>
          <WheelPicker
            items={ACTIVITY_ITEMS}
            selectedIndex={activityIdx}
            onChange={(idx) => {
              setActivityIdx(idx);
              setActivityLevel(ACTIVITY_LEVELS[idx]);
            }}
            width={pickerW}
          />
        </View>

        <Pressable
          style={styles.btn}
          onPress={() => router.push("/(onboarding)/personal")}
        >
          <Text style={styles.btnText}>CONTINUAR →</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { paddingHorizontal: 32, paddingTop: 64, paddingBottom: 40 },
  backBtn: { marginBottom: 28 },
  backText: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3, letterSpacing: 2 },
  progress: { flexDirection: "row", gap: 8, marginBottom: 32 },
  dot: { width: 24, height: 2, backgroundColor: Colors.b2 },
  dotActive: { backgroundColor: Colors.gold },
  step: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes["3xl"],
    color: Colors.t1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
    lineHeight: 20,
    marginBottom: 32,
  },
  section: { gap: 12, marginBottom: 40 },
  card: { padding: 20, borderWidth: 1, borderColor: Colors.b1, borderRadius: 12, gap: 8 },
  cardActive: { borderColor: Colors.gold },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: Colors.t2,
    letterSpacing: 1,
  },
  cardTitleActive: { color: Colors.t1 },
  check: { color: Colors.gold, fontSize: 14 },
  cardDesc: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
    lineHeight: 16,
  },
  sectionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: Colors.t3,
    letterSpacing: 2,
    marginBottom: 12,
  },
  activityPicker: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Colors.b1,
    marginBottom: 40,
    backgroundColor: Colors.c1,
  },
  btn: {
    borderWidth: 1,
    borderColor: Colors.t1,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t1,
    letterSpacing: 3,
  },
});
