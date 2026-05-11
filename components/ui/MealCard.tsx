import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { ScanHistoryItem } from "@/types";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "CAFÉ DA MANHÃ",
  lunch: "ALMOÇO",
  dinner: "JANTAR",
  snack: "LANCHE",
};

interface MealCardProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  meal?: ScanHistoryItem;
  onAdd?: () => void;
  onPress?: () => void;
}

export function MealCard({ mealType, meal, onAdd, onPress }: MealCardProps) {
  const label = MEAL_LABELS[mealType] ?? mealType.toUpperCase();
  const kcal = meal ? Math.round(meal.calories * meal.portion_multiplier) : 0;
  const time = meal
    ? new Date(meal.logged_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  if (!meal) {
    return (
      <Pressable onPress={onAdd} style={[styles.card, styles.cardEmpty]}>
        <Text style={styles.typeLabel}>{label}</Text>
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Não registrado</Text>
          <Text style={styles.addBtn}>+ add</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.typeLabel}>{label}</Text>
      <View style={styles.filledRow}>
        <Text style={styles.mealName} numberOfLines={1}>{meal.food_name}</Text>
        <View style={styles.rightCol}>
          <Text style={styles.kcal}>{kcal} kcal</Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: Colors.b1,
    backgroundColor: Colors.c1,
    padding: 16, marginBottom: 8, gap: 6,
  },
  cardEmpty: {
    borderColor: 'rgba(235,224,205,0.10)',
    backgroundColor: "transparent", opacity: 0.65,
  },
  typeLabel: { fontFamily: fonts.sansLight, fontSize: 9, color: Colors.t4, letterSpacing: 2 },
  filledRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mealName: { fontFamily: fonts.sansRegular, fontSize: fontSizes.sm, color: Colors.t2, flex: 1 },
  rightCol: { alignItems: "flex-end", gap: 2 },
  kcal: { fontFamily: fonts.monoLight, fontSize: fontSizes.sm, color: Colors.t1 },
  time: { fontFamily: fonts.sansLight, fontSize: 10, color: Colors.t4 },
  emptyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  emptyText: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t4 },
  addBtn: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: '#C9A96E' },
});
