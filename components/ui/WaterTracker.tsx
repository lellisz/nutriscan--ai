import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, fonts } from "@/constants/design";

interface WaterTrackerProps {
  date: string; // "YYYY-MM-DD"
}

const TOTAL_CUPS = 8;
const ML_PER_CUP = 250;

export function WaterTracker({ date }: WaterTrackerProps) {
  const [cups, setCups] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(`water_${date}`).then((v) => {
      if (v !== null) setCups(parseInt(v));
    });
  }, [date]);

  async function handlePress(idx: number) {
    const next = cups === idx + 1 ? idx : idx + 1;
    setCups(next);
    await AsyncStorage.setItem(`water_${date}`, String(next));
    if (Platform.OS !== "web") {
      try {
        const Haptics = await import("expo-haptics");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length: TOTAL_CUPS }).map((_, i) => (
          <Pressable key={i} onPress={() => handlePress(i)} style={[styles.cup, i < cups && styles.cupFilled]} />
        ))}
      </View>
      <Text style={styles.label}>{cups * ML_PER_CUP}ml / {TOTAL_CUPS * ML_PER_CUP}ml</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: "row", gap: 6 },
  cup: { width: 28, height: 28, borderRadius: 4, borderWidth: 1, borderColor: Colors.b3, backgroundColor: "transparent" },
  cupFilled: { backgroundColor: "#3a6fa8", borderColor: "#2a5a90" },
  label: { fontFamily: fonts.sansLight, fontSize: 10, color: Colors.t4, letterSpacing: 1 },
});
