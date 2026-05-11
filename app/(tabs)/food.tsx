import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors as SpecColors } from "@/constants/Colors";
import { fonts } from "@/constants/design";
import { useDailyNutrition } from "@/hooks/useNutrition";
import { useAuthStore } from "@/stores/authStore";

// ─── BARRA DE PROGRESSO SIMPLES ──────────────────────────────────────────────

function MacroBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── LINHA MACRO ──────────────────────────────────────────────────────────────

function MacroRow({
  label, value, goal, unit, color,
}: { label: string; value: number; goal: number; unit: string; color: string }) {
  const pct = goal > 0 ? Math.round((value / goal) * 100) : 0;
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
          <Text style={styles.macroValue}>{Math.round(value)}</Text>
          <Text style={styles.macroGoal}>/ {Math.round(goal)} {unit}</Text>
          <Text style={[styles.macroPct, { color }]}>{pct}%</Text>
        </View>
      </View>
      <MacroBar value={value} goal={goal} color={color} />
    </View>
  );
}

// ─── TELA MACROS ─────────────────────────────────────────────────────────────

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { data, isLoading } = useDailyNutrition();

  const totals = data?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const calGoal = profile?.calories_target ?? 2000;
  const protGoal = profile?.protein_target ?? 150;

  // metas estimadas a partir de calorias (se não houver específicas)
  const carbGoal = Math.round((calGoal * 0.45) / 4);
  const fatGoal  = Math.round((calGoal * 0.30) / 9);

  const calPct = calGoal > 0 ? Math.min(totals.calories / calGoal, 1) : 0;
  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short",
  }).toUpperCase().replace(".", "");

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>M A C R O S</Text>
          <Text style={styles.headerDate}>{dateLabel}</Text>
        </View>

        {/* CARD CALORIAS */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CALORIAS · HOJE</Text>
          <View style={styles.calRow}>
            <Text style={styles.calValue}>{Math.round(totals.calories)}</Text>
            <Text style={styles.calGoalText}> / {calGoal}</Text>
          </View>
          {/* progress bar linear */}
          <View style={styles.calBarTrack}>
            <View style={[styles.calBarFill, { width: `${calPct * 100}%` as any }]} />
          </View>
          <Text style={styles.calNote}>
            {calGoal - Math.round(totals.calories) > 0
              ? `${calGoal - Math.round(totals.calories)} kcal restantes`
              : "Meta atingida"}
          </Text>
        </View>

        {/* CARD MACRONUTRIENTES */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardLabel}>MACRONUTRIENTES</Text>

          <MacroRow
            label="PROTEÍNA"
            value={totals.protein}
            goal={protGoal}
            unit="g"
            color={SpecColors.AC}
          />
          <View style={styles.divider} />
          <MacroRow
            label="CARBOIDRATO"
            value={totals.carbs}
            goal={carbGoal}
            unit="g"
            color={SpecColors.CO}
          />
          <View style={styles.divider} />
          <MacroRow
            label="GORDURA"
            value={totals.fat}
            goal={fatGoal}
            unit="g"
            color={SpecColors.WRN}
          />
          <View style={styles.divider} />
          <MacroRow
            label="FIBRAS"
            value={totals.fiber}
            goal={25}
            unit="g"
            color={SpecColors.OK}
          />
        </View>

        {/* DISTRIBUIÇÃO % */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardLabel}>DISTRIBUIÇÃO</Text>
          <View style={styles.distRow}>
            {[
              { label: "PROT", value: totals.protein * 4, color: SpecColors.AC },
              { label: "CARB", value: totals.carbs * 4, color: SpecColors.CO },
              { label: "GORD", value: totals.fat * 9, color: SpecColors.WRN },
            ].map(({ label, value, color }) => {
              const totalKcal = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
              const pct = totalKcal > 0 ? Math.round((value / totalKcal) * 100) : 0;
              return (
                <View key={label} style={styles.distItem}>
                  <View style={[styles.distDot, { backgroundColor: color }]} />
                  <Text style={styles.distPct}>{pct}%</Text>
                  <Text style={styles.distLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* BOTÃO REGISTRAR */}
      <View style={[styles.fab, { bottom: insets.bottom + 72 }]}>
        <Pressable
          style={styles.fabBtn}
          onPress={() => router.push("/log/camera" as any)}
          hitSlop={8}
        >
          <Text style={styles.fabText}>📷  REGISTRAR REFEIÇÃO</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SpecColors.BG,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLabel: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    letterSpacing: 6,
    color: SpecColors.WH,
  },
  headerDate: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    letterSpacing: 2,
    color: SpecColors.W3,
  },
  card: {
    backgroundColor: SpecColors.C1,
    borderWidth: 0.5,
    borderColor: SpecColors.B1,
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: SpecColors.W3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  calRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  calValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 42,
    letterSpacing: -1,
    color: SpecColors.WH,
  },
  calGoalText: {
    fontFamily: fonts.monoLight,
    fontSize: 18,
    color: SpecColors.W3,
    marginBottom: 2,
  },
  calBarTrack: {
    height: 3,
    backgroundColor: SpecColors.B1,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  calBarFill: {
    height: 3,
    backgroundColor: SpecColors.AC,
    borderRadius: 2,
  },
  calNote: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: SpecColors.W3,
  },
  macroRow: {
    paddingVertical: 10,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  macroLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 2,
    color: SpecColors.W3,
  },
  macroValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 16,
    color: SpecColors.WH,
  },
  macroGoal: {
    fontFamily: fonts.monoLight,
    fontSize: 13,
    color: SpecColors.W3,
  },
  macroPct: {
    fontFamily: fonts.monoRegular,
    fontSize: 11,
  },
  barTrack: {
    height: 2,
    backgroundColor: SpecColors.B1,
    borderRadius: 1,
    overflow: "hidden",
  },
  barFill: {
    height: 2,
    borderRadius: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: SpecColors.B1,
  },
  distRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 4,
  },
  distItem: {
    alignItems: "center",
    gap: 6,
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distPct: {
    fontFamily: fonts.monoRegular,
    fontSize: 18,
    color: SpecColors.WH,
  },
  distLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 9,
    letterSpacing: 2,
    color: SpecColors.W3,
  },
  fab: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  fabBtn: {
    height: 52,
    backgroundColor: SpecColors.WH,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 3,
    color: SpecColors.BG,
    textTransform: "uppercase",
  },
});
