import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { fonts } from "@/constants/design";
import { Colors as SpecColors } from "@/constants/Colors";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useFrequentMeals } from "@/hooks/useFrequentMeals";

// ---------------------------------------------------------------------------
// Spec Tokens
// ---------------------------------------------------------------------------
const BG = "#07070D";
const C1 = "#0D0D17";
const C2 = "#12121F";
const WH = "#EBE4D2";
const W3 = "#8A8070";
const W4 = "#4A4860";
const AC = "#6B5FE4";
const B1 = "#2A2840";

// ---------------------------------------------------------------------------
// Local food database (per 100g)
// ---------------------------------------------------------------------------

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const FOOD_DB: FoodItem[] = [
  { name: "Frango grelhado", calories: 165, protein: 31, carbs: 0, fat: 4, fiber: 0 },
  { name: "Arroz integral", calories: 130, protein: 3, carbs: 28, fat: 1, fiber: 2 },
  { name: "Arroz branco", calories: 128, protein: 3, carbs: 28, fat: 0, fiber: 0 },
  { name: "Feijão cozido", calories: 77, protein: 5, carbs: 14, fat: 0, fiber: 6 },
  { name: "Ovo mexido", calories: 155, protein: 11, carbs: 1, fat: 12, fiber: 0 },
  { name: "Ovo cozido", calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0 },
  { name: "Aveia em flocos", calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11 },
  { name: "Banana", calories: 89, protein: 1, carbs: 23, fat: 0, fiber: 3 },
  { name: "Maçã", calories: 52, protein: 0, carbs: 14, fat: 0, fiber: 2 },
  { name: "Batata doce", calories: 86, protein: 2, carbs: 20, fat: 0, fiber: 3 },
  { name: "Batata cozida", calories: 77, protein: 2, carbs: 17, fat: 0, fiber: 2 },
  { name: "Pão integral", calories: 247, protein: 9, carbs: 41, fat: 4, fiber: 7 },
  { name: "Leite integral", calories: 61, protein: 3, carbs: 5, fat: 3, fiber: 0 },
  { name: "Iogurte natural", calories: 59, protein: 4, carbs: 5, fat: 3, fiber: 0 },
  { name: "Queijo minas", calories: 264, protein: 17, carbs: 3, fat: 21, fiber: 0 },
  { name: "Carne bovina", calories: 218, protein: 26, carbs: 0, fat: 13, fiber: 0 },
  { name: "Atum em lata", calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 },
  { name: "Salmão grelhado", calories: 208, protein: 28, carbs: 0, fat: 10, fiber: 0 },
  { name: "Macarrão cozido", calories: 131, protein: 5, carbs: 25, fat: 1, fiber: 2 },
  { name: "Alface", calories: 15, protein: 1, carbs: 3, fat: 0, fiber: 1 },
  { name: "Tomate", calories: 18, protein: 1, carbs: 4, fat: 0, fiber: 1 },
  { name: "Cenoura", calories: 41, protein: 1, carbs: 10, fat: 0, fiber: 3 },
  { name: "Brócolis", calories: 34, protein: 3, carbs: 7, fat: 0, fiber: 3 },
  { name: "Azeite de oliva", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Amendoim", calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 9 },
  { name: "Whey protein", calories: 400, protein: 80, carbs: 6, fat: 6, fiber: 0 },
  { name: "Pão de forma", calories: 265, protein: 9, carbs: 49, fat: 4, fiber: 2 },
  { name: "Laranja", calories: 47, protein: 1, carbs: 12, fat: 0, fiber: 2 },
  { name: "Mamão", calories: 43, protein: 0, carbs: 11, fat: 0, fiber: 2 },
  { name: "Abacate", calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

function isMealType(value: string | undefined): value is MealType {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack";
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Cafe",
  lunch: "Almoco",
  dinner: "Jantar",
  snack: "Lanche",
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcMacros(food: FoodItem, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor),
    carbs: Math.round(food.carbs * factor),
    fat: Math.round(food.fat * factor),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MacroChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={chipStyles.box}>
      <Text style={chipStyles.val}>{value}</Text>
      <Text style={chipStyles.lbl}>{label}</Text>
    </View>
  );
}

function QuantityEditor({
  food,
  grams,
  onAdjustGrams,
  onChangeGrams,
}: {
  food: FoodItem;
  grams: number;
  onAdjustGrams: (delta: number) => void;
  onChangeGrams: (grams: number) => void;
}) {
  const macros = calcMacros(food, grams);

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.quantityBox}>
      <Text style={styles.quantityTitle}>
        {food.name.toUpperCase()} — QUANTIDADE
      </Text>

      <View style={styles.stepper}>
        <Pressable style={styles.stepBtn} onPress={() => onAdjustGrams(-10)}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          style={styles.gramsInput}
          value={String(grams)}
          onChangeText={(value) => {
            const next = parseInt(value, 10);
            if (!Number.isNaN(next) && next >= 10 && next <= 1000) {
              onChangeGrams(next);
            }
          }}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.gramsUnit}>g</Text>
        <Pressable style={styles.stepBtn} onPress={() => onAdjustGrams(10)}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.macrosRow}>
        <MacroChip label="kcal" value={macros.calories} />
        <MacroChip label="prot" value={macros.protein} />
        <MacroChip label="carbs" value={macros.carbs} />
        <MacroChip label="gord" value={macros.fat} />
      </View>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  box: { alignItems: "center", flex: 1 },
  val: { fontFamily: fonts.monoRegular, fontSize: 15, color: WH },
  lbl: { fontFamily: fonts.sansRegular, fontSize: 9, color: W3, letterSpacing: 1 },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AddScreen() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string | string[] }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const initialType = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const [mealType, setMealType] = useState<MealType>(isMealType(initialType) ? initialType : "breakfast");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);
  const [saving, setSaving] = useState(false);
  const { data: frequents = [] } = useFrequentMeals(user?.id);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return FOOD_DB.filter((food) => food.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  function handleSelect(food: FoodItem) {
    setSelected(food);
    setGrams(100);
  }

  function adjustGrams(delta: number) {
    setGrams((current) => Math.max(10, Math.min(1000, current + delta)));
  }

  async function handleAdd() {
    if (!selected || !user || grams === 0) return;
    setSaving(true);
    try {
      const multiplier = grams / 100;
      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        name: selected.name,
        calories: Math.round((selected.calories ?? 0) * multiplier),
        protein: Math.round((selected.protein ?? 0) * multiplier),
        carbs: Math.round((selected.carbs ?? 0) * multiplier),
        fat: Math.round((selected.fat ?? 0) * multiplier),
        fiber: selected.fiber != null ? Math.round(selected.fiber * multiplier) : null,
        confidence: "alta",
        meal_type: mealType,
        source: "manual",
        logged_at: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;

      if (Platform.OS !== "web") {
        try {
          const Haptics = await import("expo-haptics");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      await queryClient.invalidateQueries({ queryKey: ["nutrition", "daily"] });
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar.";
      Alert.alert("Erro", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
          <Text style={styles.backText}>X</Text>
        </Pressable>
        <Text style={styles.title}>R E F E I C A O</Text>
        <View style={styles.spacer} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.inner}
      >
        {/* Meal type chips */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.typeRow}>
          {MEAL_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.typeChip, mealType === type && styles.typeChipActive]}
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.typeChipText, mealType === type && styles.typeChipTextActive]}>
                {MEAL_TYPE_LABELS[type].toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchBox}>
          <Text style={styles.searchIcon}>?</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelected(null);
            }}
            placeholder="Buscar alimento..."
            placeholderTextColor={W4}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </Animated.View>

        {/* Results */}
        {query.trim().length >= 2 && (
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            {results.length === 0 ? (
              <Text style={styles.noResults}>Nenhum alimento encontrado</Text>
            ) : (
              results.map((food) => (
                <View key={food.name}>
                  <Pressable
                    style={styles.resultRow}
                    onPress={() => handleSelect(food)}
                  >
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultName}>{food.name}</Text>
                      <Text style={styles.resultMeta}>por 100g - {food.calories}kcal</Text>
                    </View>
                    <View style={styles.resultRight}>
                      <Text style={styles.resultCal}>{food.calories}</Text>
                      <View
                        style={[
                          styles.addCircle,
                          selected?.name === food.name && styles.addCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.addIcon,
                            selected?.name === food.name && styles.addIconActive,
                          ]}
                        >
                          {selected?.name === food.name ? "v" : "+"}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {selected?.name === food.name && (
                    <QuantityEditor
                      food={food}
                      grams={grams}
                      onAdjustGrams={adjustGrams}
                      onChangeGrams={setGrams}
                    />
                  )}
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* Recentes / empty state */}
        {query.trim().length < 2 &&
          (frequents.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(40).springify()}>
              <Text style={styles.recentsLabel}>RECENTES</Text>
              {frequents.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.resultRow}
                  onPress={() =>
                    handleSelect({
                      name: item.name,
                      calories: item.calories,
                      protein: item.protein,
                      carbs: item.carbs,
                      fat: item.fat,
                      fiber: 0,
                    })
                  }
                >
                  <View style={styles.resultLeft}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultMeta}>por 100g - {item.calories}kcal - usado {item.count}x</Text>
                  </View>
                  <View style={styles.resultRight}>
                    <Text style={styles.resultCal}>{item.calories}</Text>
                    <View style={styles.addCircle}>
                      <Text style={styles.addIcon}>+</Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              {selected && (
                <QuantityEditor
                  food={selected}
                  grams={grams}
                  onAdjustGrams={adjustGrams}
                  onChangeGrams={setGrams}
                />
              )}
            </Animated.View>
          ) : (
            <View style={styles.hint}>
              <Text style={styles.hintText}>Digite pelo menos 2 letras para buscar</Text>
            </View>
          ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add button */}
      {selected && (
        <Animated.View entering={FadeInDown.springify()} style={styles.footer}>
          <Pressable
            style={[styles.addBtn, saving && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={BG} size="small" />
            ) : (
              <Text style={styles.addBtnText}>SALVAR</Text>
            )}
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: B1,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backText: { fontFamily: fonts.sansRegular, fontSize: 18, color: W3 },
  title: { fontFamily: fonts.serifLight, fontSize: 20, color: WH, letterSpacing: 5 },
  spacer: { width: 44 },
  inner: { paddingHorizontal: 20, paddingTop: 20 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  typeChip: {
    borderWidth: 0.5,
    borderColor: B1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  typeChipActive: { borderColor: AC },
  typeChipText: { fontFamily: fonts.sansRegular, fontSize: 11, color: W3, letterSpacing: 1 },
  typeChipTextActive: { color: AC },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C2,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: { fontFamily: fonts.sansRegular, fontSize: 16, color: W4 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sansLight,
    fontSize: 14,
    color: WH,
  },
  noResults: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: W4,
    textAlign: "center",
    paddingTop: 40,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: B1,
  },
  resultLeft: { flex: 1, gap: 2 },
  resultName: { fontFamily: fonts.sansRegular, fontSize: 14, color: WH },
  resultMeta: { fontFamily: fonts.sansLight, fontSize: 11, color: W3 },
  resultRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultCal: { fontFamily: fonts.monoRegular, fontSize: 14, color: W3 },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: B1,
    alignItems: "center",
    justifyContent: "center",
  },
  addCircleActive: { borderColor: AC, backgroundColor: AC },
  addIcon: { fontFamily: fonts.sansLight, fontSize: 14, color: W3 },
  addIconActive: { color: WH },
  quantityBox: {
    backgroundColor: C1,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 2,
    gap: 12,
  },
  quantityTitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 9,
    color: W3,
    letterSpacing: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontFamily: fonts.sansLight, fontSize: 20, color: WH },
  gramsInput: {
    fontFamily: fonts.monoRegular,
    fontSize: 28,
    color: WH,
    textAlign: "center",
    minWidth: 80,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  gramsUnit: { fontFamily: fonts.sansLight, fontSize: 14, color: W3, marginRight: 8 },
  macrosRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: B1,
    paddingTop: 12,
  },
  hint: { paddingTop: 40, alignItems: "center" },
  hintText: { fontFamily: fonts.sansLight, fontSize: 13, color: W4 },
  recentsLabel: { fontFamily: fonts.sansRegular, fontSize: 10, color: W3, letterSpacing: 2, marginBottom: 8 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: BG,
    borderTopWidth: 0.5,
    borderTopColor: B1,
  },
  addBtn: {
    backgroundColor: WH,
    height: 52,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontFamily: fonts.sansMedium, fontSize: 12, color: BG, letterSpacing: 3 },
});
