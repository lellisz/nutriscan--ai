import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Colors, fonts } from "@/constants/design";

interface PeriodChip { label: string; value: number; }

interface PeriodChipsProps {
  options: PeriodChip[];
  selected: number;
  onSelect: (value: number) => void;
}

export function PeriodChips({ options, selected, onSelect }: PeriodChipsProps) {
  async function handlePress(value: number) {
    onSelect(value);
    if (Platform.OS !== "web") {
      try {
        const Haptics = await import("expo-haptics");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable key={opt.value} onPress={() => handlePress(opt.value)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.b1, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { borderColor: Colors.gold },
  label: { fontFamily: fonts.sansLight, fontSize: 11, color: Colors.t3, letterSpacing: 1 },
  labelActive: { color: Colors.gold },
});
