import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Atenção", "As senhas não conferem.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      // Redirect handled by auth listener → onboarding
    } catch (err: any) {
      Alert.alert("Erro ao criar conta", err.message || "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify()}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLTAR</Text>
          </Pressable>

          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Comece sua jornada de nutrição de precisão.
          </Text>

          <View style={styles.fields}>
            {[
              { label: "NOME", value: name, set: setName, placeholder: "Seu nome", secure: false, keyboard: "default" as const },
              { label: "E-MAIL", value: email, set: setEmail, placeholder: "seu@email.com", secure: false, keyboard: "email-address" as const },
              { label: "SENHA", value: password, set: setPassword, placeholder: "Mínimo 6 caracteres", secure: true, keyboard: "default" as const },
              { label: "CONFIRMAR SENHA", value: confirm, set: setConfirm, placeholder: "Repita a senha", secure: true, keyboard: "default" as const },
            ].map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.set}
                  secureTextEntry={field.secure}
                  keyboardType={field.keyboard}
                  autoCapitalize={field.keyboard === "email-address" ? "none" : "words"}
                  placeholderTextColor={Colors.t4}
                  placeholder={field.placeholder}
                />
              </View>
            ))}
          </View>

          <Pressable style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <Text style={styles.btnText}>CRIAR CONTA</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.linkText}>
              Já tem conta?{" "}
              <Text style={styles.linkHighlight}>Entrar</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { paddingHorizontal: 32, paddingTop: 64, paddingBottom: 40 },
  backBtn: { marginBottom: 48 },
  backText: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3, letterSpacing: 2 },
  title: { fontFamily: fonts.serifLight, fontSize: fontSizes["3xl"], color: Colors.t1, marginBottom: 8 },
  subtitle: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3, lineHeight: 20, marginBottom: 48 },
  fields: { gap: 24, marginBottom: 40 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: fonts.sansMedium, fontSize: fontSizes.xs - 1, color: Colors.t3, letterSpacing: 2 },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.b2, paddingVertical: 12, fontFamily: fonts.sansLight, fontSize: fontSizes.md, color: Colors.t1 },
  btn: { backgroundColor: Colors.c2, borderWidth: 1, borderColor: Colors.b3, paddingVertical: 16, alignItems: "center", marginBottom: 24, borderRadius: 4 },
  btnText: { fontFamily: fonts.sansMedium, fontSize: fontSizes.xs, color: Colors.t1, letterSpacing: 3 },
  linkText: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3, textAlign: "center" },
  linkHighlight: { color: '#C9A96E' },
});
