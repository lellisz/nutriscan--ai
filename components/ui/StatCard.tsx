import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, fonts, fontSizes } from "@/constants/design";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  badgePositive?: boolean; // true=green, false=red, undefined=neutral
}

export function StatCard({ label, value, unit, badge, badgePositive }: StatCardProps) {
  const badgeColor = badgePositive === true ? '#7ea88c' : badgePositive === false ? '#c47e6e' : Colors.t4;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {badge ? <Text style={[styles.badge, { color: badgeColor }]}>{badge}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.c1,
    borderWidth: 1, borderColor: Colors.b1,
    padding: 16, gap: 4,
  },
  label: { fontFamily: fonts.sansLight, fontSize: 9, color: Colors.t4, letterSpacing: 1 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  value: { fontFamily: fonts.monoLight, fontSize: fontSizes["2xl"], color: Colors.t1 },
  unit: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3 },
  badge: { fontFamily: fonts.sansLight, fontSize: 9, letterSpacing: 0.5 },
});
