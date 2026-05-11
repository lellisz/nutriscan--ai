import { useState, useEffect } from "react";
import {
  View, Text, Image, Pressable, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { fonts } from "@/constants/design";
import { Colors as SpecColors } from "@/constants/Colors";
import { analyzeFood, saveMeal } from "@/services/scan";
import { useAuthStore } from "@/stores/authStore";
import { ScanApiResponse } from "@/types";

// TELA 05 Tokens
const T = {
  BG: SpecColors.BG,
  C1: SpecColors.C1,
  C2: SpecColors.C2,
  WH: SpecColors.WH,
  W2: SpecColors.W2,
  W3: SpecColors.W3,
  AC: SpecColors.AC,
  B1: SpecColors.B1,
} as const;

export default function ResultScreen() {
  const { uri, prefilled } = useLocalSearchParams<{ uri?: string; prefilled?: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // prefilled = result from voice/restaurant (no camera image)
  const isPrefilled = !!prefilled;

  const [analyzing, setAnalyzing] = useState(!isPrefilled);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ScanApiResponse | null>(() => {
    if (prefilled) {
      try { return JSON.parse(prefilled) as ScanApiResponse; } catch { return null; }
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [portion, setPortion] = useState(1.0);

  useEffect(() => {
    if (isPrefilled || !uri) return;
    analyzeFood(uri)
      .then(setResult)
      .catch((e) => setError(e.message ?? "Erro ao analisar"))
      .finally(() => setAnalyzing(false));
  }, [uri, isPrefilled]);

  async function handleConfirm() {
    if (!result || !user) return;
    setSaving(true);
    try {
      await saveMeal(user.id, result, { portionMultiplier: portion });
      qc.invalidateQueries({ queryKey: ["nutrition", "daily"] });
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const MACROS = result ? [
    { label: "KCAL", value: Math.round(result.calories * portion), unit: "" },
    { label: "PROT.", value: +(result.protein * portion).toFixed(1), unit: "g" },
    { label: "CARB.", value: +(result.carbs * portion).toFixed(1), unit: "g" },
    { label: "GORD.", value: +(result.fat * portion).toFixed(1), unit: "g" },
  ] : [];

  const confidenceValue = result?.confidence === 'alta' ? '94' : result?.confidence === 'media' ? '72' : '51';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={6}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          <Text style={styles.headerSubtitle}>PRAXIS · 2ª REFEIÇÃO</Text>
          <Text style={styles.headerTitle}>RESULTADO IA</Text>
        </View>

        {/* IMAGE */}
        {uri && (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        )}

        {analyzing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={T.AC} size="large" />
            <Text style={styles.loadingText}>Analisando com Gemini Vision...</Text>
            <Text style={styles.loadingHint}>identificando macronutrientes</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Não foi possível identificar</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => router.back()}>
              <Text style={styles.retryText}>TENTAR NOVAMENTE</Text>
            </Pressable>
          </View>
        ) : result ? (
          <Animated.View entering={FadeInDown.springify()}>
            {/* CARD IDENTIFICAÇÃO */}
            <View style={styles.cardIdent}>
              <Text style={styles.foodName}>{result.food_name}</Text>
              <Text style={styles.identLabel}>GEMINI VISION · {confidenceValue}% CONF.</Text>
              <Pressable style={styles.editBtn}>
                <Text style={styles.editBtnText}>✎ EDITAR</Text>
              </Pressable>
            </View>

            {/* CARD COMPOSIÇÃO */}
            <View style={styles.cardComp}>
              <Text style={styles.compLabel}>COMPOSIÇÃO ESTIMADA</Text>
              {MACROS.map((m, i) => (
                <View key={m.label} style={[styles.macroRow, i < MACROS.length - 1 && styles.macroRowBorder]}>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                  <Text style={styles.macroValue}>{m.value}{m.unit}</Text>
                </View>
              ))}
            </View>

            {/* PORÇÃO */}
            <View style={styles.portionRow}>
              <Text style={styles.portionLabel}>PORÇÃO</Text>
              <View style={styles.portionControls}>
                <Pressable
                  style={styles.portionBtn}
                  onPress={() => setPortion((p) => Math.max(0.25, +(p - 0.25).toFixed(2)))}
                >
                  <Text style={styles.portionBtnText}>−</Text>
                </Pressable>
                <Text style={styles.portionValue}> {portion}× </Text>
                <Pressable
                  style={styles.portionBtn}
                  onPress={() => setPortion((p) => Math.min(5, +(p + 0.25).toFixed(2)))}
                >
                  <Text style={styles.portionBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* AI TIP */}
            {result.ai_tip && (
              <View style={styles.tipBox}>
                <Text style={styles.tipLabel}>COACH PRAXIS</Text>
                <Text style={styles.tipText}>{result.ai_tip}</Text>
              </View>
            )}
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* FOOTER */}
      {result && !analyzing && (
        <Animated.View entering={FadeInUp.springify()} style={styles.footer}>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={T.BG} />
            ) : (
              <Text style={styles.confirmText}>CONFIRMAR REFEIÇÃO</Text>
            )}
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.editManualText}>EDITAR MANUALMENTE</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.BG },

  // HEADER
  header: { paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { fontFamily: fonts.sansRegular, fontSize: 11, color: T.W3 },
  headerSubtitle: { fontFamily: fonts.sansRegular, fontSize: 10, color: T.W3, letterSpacing: 2, marginTop: 12 },
  headerTitle: { fontFamily: fonts.serifLight, fontSize: 28, color: T.WH, letterSpacing: 6 },

  // IMAGE
  image: { width: "100%", height: 220, marginTop: 16 },

  // LOADING
  loadingBox: { paddingTop: 60, alignItems: "center", gap: 16 },
  loadingText: { fontFamily: fonts.serifLight, fontSize: 18, color: T.WH },
  loadingHint: { fontFamily: fonts.sansLight, fontSize: 11, color: T.W3, letterSpacing: 1 },

  // ERROR
  errorBox: { padding: 32, gap: 12 },
  errorTitle: { fontFamily: fonts.serifLight, fontSize: 20, color: T.WH },
  errorDesc: { fontFamily: fonts.sansLight, fontSize: 13, color: T.W3 },
  retryBtn: { borderWidth: 0.5, borderColor: T.WH, height: 52, alignItems: "center", justifyContent: "center", marginTop: 8 },
  retryText: { fontFamily: fonts.sansMedium, fontSize: 12, color: T.WH },

  // CARD IDENTIFICAÇÃO
  cardIdent: { marginHorizontal: 20, marginTop: 16, padding: 16, backgroundColor: T.C1, borderWidth: 0.5, borderColor: T.B1, borderRadius: 12 },
  foodName: { fontFamily: fonts.serifRegular, fontSize: 18, color: T.WH, fontStyle: 'italic' },
  identLabel: { fontFamily: fonts.sansRegular, fontSize: 10, color: T.AC, letterSpacing: 2, marginTop: 4 },
  editBtn: { alignSelf: 'flex-start', borderWidth: 0.5, borderColor: T.B1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, marginTop: 8 },
  editBtnText: { fontFamily: fonts.sansRegular, fontSize: 10, color: T.W3 },

  // CARD COMPOSIÇÃO
  cardComp: { marginHorizontal: 20, marginTop: 12, padding: 16, backgroundColor: T.C1, borderWidth: 0.5, borderColor: T.B1, borderRadius: 12 },
  compLabel: { fontFamily: fonts.sansRegular, fontSize: 10, color: T.W3, letterSpacing: 2, marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  macroRowBorder: { borderBottomWidth: 0.5, borderBottomColor: T.B1 },
  macroLabel: { fontFamily: fonts.sansRegular, fontSize: 11, color: T.W3 },
  macroValue: { fontFamily: fonts.monoRegular, fontSize: 16, color: T.WH },

  // PORÇÃO
  portionRow: { marginHorizontal: 20, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  portionLabel: { fontFamily: fonts.sansRegular, fontSize: 10, color: T.W3, letterSpacing: 2 },
  portionControls: { flexDirection: 'row', alignItems: 'center' },
  portionBtn: { width: 44, height: 44, backgroundColor: T.C2, borderWidth: 0.5, borderColor: T.B1, alignItems: 'center', justifyContent: 'center' },
  portionBtnText: { fontFamily: fonts.monoRegular, fontSize: 16, color: T.WH },
  portionValue: { fontFamily: fonts.monoRegular, fontSize: 16, color: T.WH, minWidth: 50, textAlign: 'center' },

  // AI TIP
  tipBox: { marginHorizontal: 20, marginTop: 12, padding: 12, backgroundColor: T.C2, borderRadius: 6, borderLeftWidth: 2, borderLeftColor: T.AC, paddingLeft: 12 },
  tipLabel: { fontFamily: fonts.sansRegular, fontSize: 9, color: T.AC, letterSpacing: 2 },
  tipText: { fontFamily: fonts.sansRegular, fontSize: 13, color: T.W2, fontStyle: 'italic', marginTop: 4 },

  // FOOTER
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.BG, borderTopWidth: 0.5, borderTopColor: T.B1, padding: 20 },
  confirmBtn: { height: 52, backgroundColor: T.WH, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontFamily: fonts.sansMedium, fontSize: 12, color: T.BG, letterSpacing: 3 },
  editManualText: { fontFamily: fonts.sansRegular, fontSize: 11, color: T.W3, textAlign: 'center', marginTop: 12 },
});
