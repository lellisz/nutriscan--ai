import { useState, useRef, useEffect } from "react";
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  FadeInDown, useSharedValue, withRepeat, withTiming,
  useAnimatedStyle, Easing,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { supabase } from "@/services/supabase";
import { ScanApiResponse } from "@/types";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://nutriscan-ai.vercel.app/api";

type Phase = "idle" | "recording" | "processing" | "error";

// ─── Pulse ring animation ─────────────────────────────────────────────────────

function PulseRing({ active }: { active: boolean }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      scale.value   = withRepeat(withTiming(1.4, { duration: 900, easing: Easing.out(Easing.ease) }), -1, true);
      opacity.value = withRepeat(withTiming(0, { duration: 900 }), -1, true);
    } else {
      scale.value   = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [active]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulseRing, ringStyle]} />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VoiceScreen() {
  const [phase, setPhase]       = useState<Phase>("idle");
  const [error, setError]       = useState<string | null>(null);
  const [seconds, setSeconds]   = useState(0);

  const recordingRef  = useRef<Audio.Recording | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  async function startRecording() {
    setError(null);
    setSeconds(0);

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      setError("Permissão de microfone negada.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    recordingRef.current = rec;
    setPhase("recording");

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s >= 59) {
          stopAndSend();
          return s;
        }
        return s + 1;
      });
    }, 1000);
  }

  async function stopAndSend() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!recordingRef.current) return;

    setPhase("processing");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("Não foi possível obter o arquivo de áudio.");

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const mimeType = Platform.OS === "ios" ? "audio/m4a" : "audio/3gpp";

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(`${API_BASE}/voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Erro ${res.status}`);
      }

      const result: ScanApiResponse & { transcript?: string } = await res.json();
      router.push({
        pathname: "/log/result",
        params: { prefilled: JSON.stringify(result) },
      });
    } catch (e: any) {
      setError(e.message ?? "Erro ao processar áudio");
      setPhase("error");
    }
  }

  function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const isRecording   = phase === "recording";
  const isProcessing  = phase === "processing";

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Registrar por voz</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      {/* Main area */}
      <View style={styles.body}>
        {/* Instruction */}
        <Text style={styles.instruction}>
          {phase === "idle"       ? "Toque para iniciar e fale o que comeu"
          : phase === "recording" ? "Ouvindo... fale claramente"
          : phase === "processing" ? "Processando com IA..."
          : "Toque para tentar novamente"}
        </Text>

        {/* Mic button with pulse */}
        <View style={styles.btnArea}>
          <PulseRing active={isRecording} />

          <Pressable
            style={[
              styles.micBtn,
              isRecording  && styles.micBtnActive,
              isProcessing && styles.micBtnDisabled,
            ]}
            onPress={() => {
              if (phase === "idle" || phase === "error") {
                startRecording();
              } else if (phase === "recording") {
                stopAndSend();
              }
            }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <Text style={[styles.micIcon, isRecording && styles.micIconActive]}>
                {isRecording ? "■" : "●"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Timer */}
        {isRecording && (
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
        )}

        {/* Error */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Hint */}
        {(phase === "idle" || phase === "error") && (
          <Text style={styles.hint}>
            Exemplo: "Comi dois ovos mexidos com arroz integral e uma banana"
          </Text>
        )}

        {isRecording && (
          <Text style={styles.hintSmall}>Toque novamente para parar e analisar</Text>
        )}
      </View>
    </View>
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

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 32,
  },

  instruction: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  btnArea: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.t1,
  },

  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: Colors.b2,
    backgroundColor: Colors.c1,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive:   { borderColor: Colors.t1, backgroundColor: Colors.t1 },
  micBtnDisabled: { opacity: 0.5 },

  micIcon:       { fontSize: 24, color: Colors.t3 },
  micIconActive: { color: Colors.bg },

  timer: {
    fontFamily: fonts.monoLight,
    fontSize: fontSizes.lg,
    color: Colors.t1,
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },

  errorText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: '#c47e6e',
    textAlign: "center",
  },

  hint: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t4,
    textAlign: "center",
    lineHeight: 18,
  },
  hintSmall: {
    fontFamily: fonts.sansLight,
    fontSize: 10,
    color: Colors.t4,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
