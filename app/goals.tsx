import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { fonts } from "@/constants/design";
import { Colors as SpecColors } from "@/constants/Colors";
import { useAuthStore } from "@/stores/authStore";
import { useDailyNutrition } from "@/hooks/useNutrition";
import { saveNutritionGoals } from "@/services/profile";

// TELA 09 Tokens
const BG = '#07070D';
const C1 = '#0D0D17';
const C2 = '#12121F';
const WH = '#EBE4D2';
const W3 = '#8A8070';
const AC = '#6B5FE4';
const B1 = '#2A2840';

export default function GoalsScreen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data } = useDailyNutrition();
  const goals = data?.goals;

  const [calories, setCalories] = useState(String(goals?.calories ?? "2000"));
  const [protein, setProtein] = useState(String(goals?.protein ?? "150"));
  const [carbs, setCarbs] = useState(String(goals?.carbs ?? "250"));
  const [fat, setFat] = useState(String(goals?.fat ?? "65"));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveNutritionGoals(user.id, {
        calories: parseInt(calories),
        protein: parseInt(protein),
        carbs: parseInt(carbs),
        fat: parseInt(fat),
        fiber: goals?.fiber ?? 25,
      });
      qc.invalidateQueries({ queryKey: ["nutrition", "daily"] });
      router.back();
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setSaving(false);
    }
  }

  const FIELDS = [
    { label: "CALORIAS", unit: "kcal", value: calories, set: setCalories },
    { label: "PROTEÍNA", unit: "g", value: protein, set: setProtein },
    { label: "CARBOIDRATOS", unit: "g", value: carbs, set: setCarbs },
    { label: "GORDURA", unit: "g", value: fat, set: setFat },
  ];

  // Computed values for display
  const consumedCalories = Math.round(data?.totals?.calories ?? 0);
  const goalCalories = goals?.calories ?? 2000;
  const caloriesPct = Math.round((consumedCalories / goalCalories) * 100);

  // Macro goals (derived)
  const proteinGoal = goals?.protein ?? 150;
  const carbsGoal = Math.round((goalCalories * 0.45) / 4);
  const fatGoal = Math.round((goalCalories * 0.30) / 9);

  // Macro consumed
  const proteinConsumed = Math.round(data?.totals?.protein ?? 0);
  const carbsConsumed = Math.round(data?.totals?.carbs ?? 0);
  const fatConsumed = Math.round(data?.totals?.fat ?? 0);

  const MACROS = [
    { label: "PROTEÍNA", consumed: proteinConsumed, goal: proteinGoal },
    { label: "CARBOIDRATO", consumed: carbsConsumed, goal: carbsGoal },
    { label: "GORDURA", consumed: fatConsumed, goal: fatGoal },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>PRAXIS . ANALISE</Text>
          <Text style={styles.headerTitle}>COMPARACAO DE METAS</Text>
        </View>

        {/* GRID 2 CARDS */}
        <View style={styles.gridRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>META DIARIA</Text>
            <Text style={styles.statValue}>
              {goals?.calories ?? "–"} <Text style={styles.statUnit}>KCAL</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>CONSUMIDO</Text>
            <Text style={styles.statValue}>
              {consumedCalories} <Text style={styles.statUnit}>KCAL</Text>
            </Text>
            <Text style={styles.statPct}>{caloriesPct}% da meta</Text>
          </View>
        </View>

        {/* CARD MACROS */}
        <View style={styles.macrosCard}>
          <Text style={styles.macrosLabel}>MACROS HOJE</Text>
          {MACROS.map((m, idx) => {
            const pct = m.goal > 0 ? Math.min(m.consumed / m.goal, 1) : 0;
            const isLast = idx === MACROS.length - 1;
            return (
              <View
                key={m.label}
                style={[styles.macroRow, !isLast && styles.macroRowBorder]}
              >
                <View style={styles.macroInfo}>
                  <Text style={styles.macroName}>{m.label}</Text>
                  <Text style={styles.macroValue}>
                    {m.consumed}g / {m.goal}g
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* FORM */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>AJUSTAR METAS</Text>
          {FIELDS.map((f) => (
            <View key={f.label} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType="numeric"
                  placeholderTextColor={W3}
                />
                <Text style={styles.unit}>{f.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* BOTAO */}
        <Pressable
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={BG} />
          ) : (
            <Text style={styles.btnText}>SALVAR METAS</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  inner: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },

  // HEADER
  header: { marginBottom: 24 },
  headerLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: W3,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: fonts.serifLight,
    fontSize: 28,
    color: WH,
    letterSpacing: 6,
  },

  // GRID ROW
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C1,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 9,
    color: W3,
    letterSpacing: 2,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 28,
    color: WH,
  },
  statUnit: {
    fontFamily: fonts.monoRegular,
    fontSize: 14,
    color: WH,
  },
  statPct: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: AC,
    marginTop: 4,
  },

  // MACROS CARD
  macrosCard: {
    backgroundColor: C1,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  macrosLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: W3,
    letterSpacing: 2,
    marginBottom: 12,
  },
  macroRow: {
    paddingVertical: 8,
  },
  macroRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: B1,
  },
  macroInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  macroName: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: W3,
  },
  macroValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 14,
    color: WH,
  },
  progressBar: {
    height: 3,
    backgroundColor: B1,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: AC,
    borderRadius: 1.5,
  },

  // FORM CARD
  formCard: {
    backgroundColor: C2,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: W3,
    letterSpacing: 2,
    marginBottom: 16,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: W3,
    letterSpacing: 2,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: B1,
    paddingVertical: 8,
    fontFamily: fonts.monoRegular,
    fontSize: 22,
    color: WH,
  },
  unit: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: W3,
    marginLeft: 8,
  },

  // BUTTON
  btn: {
    height: 52,
    backgroundColor: WH,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: BG,
    letterSpacing: 3,
  },
});
