import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { calculateTDEE, calculateMacros, calculateBMI, saveProfile, saveNutritionGoals } from "@/services/profile";
import { grantConsent } from "@/services/consent";
import { useOnboardingStore } from "./personal";
import { useGoalStore } from "./goal";
import { useAuthStore } from "@/stores/authStore";
import { GOAL_LABELS } from "@/types";

export default function ResultsScreen() {
  const [saving, setSaving] = useState(false);
  const { user, setProfile } = useAuthStore();
  const { name, age, height, weight, targetWeight, gender, healthConsent, coachConsent } = useOnboardingStore();
  const { goal, activityLevel } = useGoalStore();

  const resolvedAge = Number.parseInt(age, 10) || 25;
  const resolvedHeight = Number.parseFloat(height) || 170;
  const resolvedWeight = Number.parseFloat(weight) || 70;
  const resolvedTargetWeight = Number.parseFloat(targetWeight) || resolvedWeight;
  const resolvedName = name.trim() || "Usuario";
  const resolvedGender = gender ?? "M";
  const resolvedGoal = goal ?? "maintain";
  const resolvedActivityLevel = activityLevel ?? "1.55";

  const calories = calculateTDEE(
    resolvedWeight,
    resolvedHeight,
    resolvedAge,
    resolvedGender,
    resolvedActivityLevel,
    resolvedGoal
  );
  const macros = calculateMacros(calories, resolvedGoal);
  const bmi = calculateBMI(resolvedWeight, resolvedHeight);

  async function handleStart() {
    if (!user) {
      Alert.alert("Sessao expirada", "Faca login novamente para continuar.");
      return;
    }

    setSaving(true);
    try {
      await saveProfile(user.id, {
        name: resolvedName,
        age: resolvedAge,
        height_cm: resolvedHeight,
        weight_kg: resolvedWeight,
        target_weight_kg: resolvedTargetWeight,
        gender: resolvedGender,
        activity_level: resolvedActivityLevel,
        goal: resolvedGoal,
        calories_target: calories,
        protein_target: macros.protein,
      });
      await saveNutritionGoals(user.id, macros);

      setProfile({
        id: user.id,
        email: user.email ?? "",
        name: resolvedName,
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
        created_at: user.created_at,
        age: resolvedAge,
        height_cm: resolvedHeight,
        weight_kg: resolvedWeight,
        target_weight_kg: resolvedTargetWeight,
        gender: resolvedGender,
        activity_level: resolvedActivityLevel,
        goal: resolvedGoal,
        calories_target: calories,
        protein_target: macros.protein,
        hydration_target: 2000,
        compassion_mode: true,
        quiet_intelligence: true,
        adaptive_goals: false,
        nutrition_memory: true,
      });

      try {
        if (healthConsent) await grantConsent('health_data_processing');
        if (coachConsent) await grantConsent('ai_coach_processing');
      } catch (consentErr) {
        console.warn('Falha silenciosa ao salvar LGPD records no primeiro login:', consentErr);
      }

      router.replace("/(tabs)");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nao foi possivel salvar. Tente novamente.";
      Alert.alert("Erro", message);
    } finally {
      setSaving(false);
    }
  }

  const MACRO_BARS = [
    { label: "PROTEINA", value: macros.protein, unit: "g", color: "#7ea88c" },
    { label: "CARBOIDRATOS", value: macros.carbs, unit: "g", color: Colors.gold },
    { label: "GORDURA", value: macros.fat, unit: "g", color: "#c47e6e" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← VOLTAR</Text>
      </Pressable>

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((n) => (
          <View key={n} style={[styles.dot, styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.step}>PASSO 4 DE 4</Text>
      <Text style={styles.title}>Suas metas</Text>
      <Text style={styles.subtitle}>
        Calculado para: <Text style={{ color: Colors.gold }}>{GOAL_LABELS[resolvedGoal]}</Text>
      </Text>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.caloriesCard}>
        <Text style={styles.caloriesLabel}>CALORIAS DIARIAS</Text>
        <Text style={styles.caloriesValue}>{calories}</Text>
        <Text style={styles.caloriesUnit}>kcal / dia</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.macros}>
        {MACRO_BARS.map((m) => (
          <View key={m.label} style={styles.macroRow}>
            <Text style={styles.macroLabel}>{m.label}</Text>
            <View style={styles.macroBarBg}>
              <View
                style={[
                  styles.macroBarFill,
                  { backgroundColor: m.color, width: `${Math.min((m.value / 300) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.macroValue, { color: m.color }]}>
              {m.value}
              {m.unit}
            </Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.bmiRow}>
        <Text style={styles.bmiLabel}>IMC ATUAL</Text>
        <Text style={styles.bmiValue}>{bmi}</Text>
      </Animated.View>

      <Pressable style={styles.btn} onPress={handleStart} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.bg} />
        ) : (
          <Text style={styles.btnText}>COMECAR AGORA →</Text>
        )}
      </Pressable>
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
  step: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3, letterSpacing: 2, marginBottom: 8 },
  title: { fontFamily: fonts.serifLight, fontSize: fontSizes["3xl"], color: Colors.t1, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3, marginBottom: 32 },
  caloriesCard: { backgroundColor: Colors.c1, borderWidth: 1, borderColor: Colors.b1, padding: 24, alignItems: "center", marginBottom: 32 },
  caloriesLabel: { fontFamily: fonts.sansLight, fontSize: 10, color: Colors.t3, letterSpacing: 2, marginBottom: 8 },
  caloriesValue: { fontFamily: fonts.monoLight, fontSize: 64, color: Colors.t1, lineHeight: 68 },
  caloriesUnit: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3, letterSpacing: 1 },
  macros: { gap: 16, marginBottom: 24 },
  macroRow: { gap: 8 },
  macroLabel: { fontFamily: fonts.sansLight, fontSize: 10, color: Colors.t3, letterSpacing: 2 },
  macroBarBg: { height: 2, backgroundColor: Colors.b1, borderRadius: 1 },
  macroBarFill: { height: 2, borderRadius: 1 },
  macroValue: { fontFamily: fonts.monoRegular, fontSize: fontSizes.sm },
  bmiRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.b1, marginBottom: 40 },
  bmiLabel: { fontFamily: fonts.sansLight, fontSize: 10, color: Colors.t3, letterSpacing: 2 },
  bmiValue: { fontFamily: fonts.monoLight, fontSize: fontSizes.xl, color: Colors.t1 },
  btn: { borderWidth: 1, borderColor: Colors.t1, paddingVertical: 16, alignItems: "center" },
  btnText: { fontFamily: fonts.sansMedium, fontSize: fontSizes.xs, color: Colors.t1, letterSpacing: 3 },
});
