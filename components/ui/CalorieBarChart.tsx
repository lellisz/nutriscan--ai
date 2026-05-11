import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, fonts } from "@/constants/design";

interface BarData { date: string; calories: number; }

interface CalorieBarChartProps {
  data: BarData[];
  goal: number;
  height?: number;
}

export const CalorieBarChart = React.memo(function CalorieBarChart({ data, goal, height = 120 }: CalorieBarChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sem dados</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.calories), goal) * 1.1;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {/* Goal line */}
        <View style={[styles.goalLine, { bottom: `${(goal / maxVal) * 100}%` as any }]} />
        <View style={styles.bars}>
          {data.map((d, i) => {
            const barH = maxVal > 0 ? (d.calories / maxVal) * 100 : 0;
            const isToday = d.date === todayStr;
            const label = new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "narrow" });
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${barH}%` as any, backgroundColor: isToday ? Colors.gold : Colors.b3 }]} />
                </View>
                <Text style={styles.dateLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 0 },
  chartArea: { position: "relative", justifyContent: "flex-end" },
  goalLine: { position: "absolute", left: 0, right: 0, height: 1, borderTopWidth: 1, borderColor: Colors.b2, borderStyle: "dashed" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: "100%", flex: 1 },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" },
  barWrapper: { width: "100%", flex: 1, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 2, minHeight: 2 },
  dateLabel: { fontFamily: fonts.sansLight, fontSize: 8, color: Colors.t4 },
  empty: { alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: fonts.sansLight, fontSize: 12, color: Colors.t4 },
});
