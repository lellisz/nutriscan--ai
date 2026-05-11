import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { supabase } from "@/services/supabase";
import { ScanApiResponse } from "@/types";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://nutriscan-ai.vercel.app/api";

export default function RestaurantScreen() {
  const [restaurantName, setRestaurantName] = useState("");
  const [dishName, setDishName]             = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const canSubmit = restaurantName.trim().length > 0 && dishName.trim().length > 0 && !loading;

  async function handleAnalyze() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(`${API_BASE}/restaurant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          dishName: dishName.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Erro ${res.status}`);
      }

      const result: ScanApiResponse = await res.json();
      router.push({
        pathname: "/log/result",
        params: { prefilled: JSON.stringify(result) },
      });
    } catch (e: any) {
      setError(e.message ?? "Erro ao analisar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Modo restaurante</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
      >
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={styles.label}>RESTAURANTE</Text>
          <TextInput
            style={styles.input}
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholder="Ex: McDonald's, Outback, Spoleto..."
            placeholderTextColor={Colors.t4}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!loading}
          />

          <Text style={[styles.label, styles.labelSpaced]}>PRATO</Text>
          <TextInput
            style={styles.input}
            value={dishName}
            onChangeText={setDishName}
            placeholder="Ex: Big Mac, Frango Apimentado, X-Burguer..."
            placeholderTextColor={Colors.t4}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleAnalyze}
            editable={!loading}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Pressable
            style={[styles.btn, !canSubmit && styles.btnDisabled]}
            onPress={handleAnalyze}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color={Colors.bg} size="small" />
            ) : (
              <Text style={styles.btnText}>ANALISAR COM IA →</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>
            A IA estima macros com base em dados públicos do restaurante.{"\n"}
            Confirme os valores na próxima tela antes de registrar.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b1,
  },
  backBtn:  { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backText: { fontFamily: fonts.sansLight, fontSize: 16, color: Colors.t3 },
  title:    { fontFamily: fonts.serifLight, fontSize: fontSizes.xl, color: Colors.t1 },

  body: { padding: 24, paddingBottom: 48 },

  label: {
    fontFamily: fonts.sansLight,
    fontSize: 10,
    color: Colors.t3,
    letterSpacing: 2,
    marginBottom: 8,
  },
  labelSpaced: { marginTop: 24 },

  input: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b2,
    paddingVertical: 10,
  },

  errorText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: '#c47e6e',
    marginTop: 16,
  },

  btn: {
    borderWidth: 1,
    borderColor: Colors.t1,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  btnDisabled: { opacity: 0.3 },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t1,
    letterSpacing: 3,
  },

  hint: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t4,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
});
