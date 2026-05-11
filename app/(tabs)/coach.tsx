import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import Svg, { Polygon, Path } from "react-native-svg";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { supabase } from "@/services/supabase";
import { loadChatHistory, persistMessage } from "@/services/chat";
import { useTodayData } from "@/hooks/useTodayData";
import { useFasting } from "@/hooks/useFasting";
import { useAuthStore } from "@/stores/authStore";
import { ChatMessage } from "@/types";

const QUICK_CHIPS = [
  "O que comer agora?",
  "Estou no déficit?",
  "Receita com proteína",
  "Como está meu dia?",
];

function PraxisTriangle() {
  return (
    <Svg viewBox="0 0 40 35" width={22} height={19}>
      <Polygon
        points="20,2 2,33 38,33"
        fill="none"
        stroke={Colors.t1}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SendArrow() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V5"
        stroke={Colors.bg}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 12L12 5L19 12"
        stroke={Colors.bg}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 400 }),
          withTiming(1.0, { duration: 400 }),
        ),
        -1,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.typingDot, animStyle]} />;
}

function TypingIndicator() {
  return (
    <View style={styles.typingRow}>
      <TypingDot delay={0}   />
      <TypingDot delay={150} />
      <TypingDot delay={300} />
    </View>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <View style={styles.bubbleUserWrapper}>
        <Text style={styles.bubbleUserLabel}>VOCÊ · AGORA</Text>
        <View style={styles.bubbleUser}>
          <Text style={styles.bubbleUserText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bubbleAssistantWrapper}>
      <Text style={styles.bubbleAssistantLabel}>COACH PRAXIS · GROQ</Text>
      <View style={styles.bubbleAssistant}>
        <Text style={styles.bubbleAssistantText}>{msg.content}</Text>
      </View>
    </View>
  );
}

function ContextCard({
  kcal,
  prot,
  water,
  fasting,
  score,
}: {
  kcal: string;
  prot: string;
  water: string;
  fasting: string;
  score: number;
}) {
  return (
    <View style={styles.contextCard}>
      <View style={styles.contextTopRow}>
        <Text style={styles.contextLabel}>CONTEXTO HOJE</Text>
        <Text style={styles.contextScore}>Score {score}/100</Text>
      </View>

      <View style={styles.contextMetricsRow}>
        <View style={styles.contextMetricCol}>
          <Text style={styles.contextMetricValue}>{kcal}</Text>
          <Text style={styles.contextMetricLabel}>KCAL</Text>
        </View>

        <View style={styles.contextSep} />

        <View style={styles.contextMetricCol}>
          <Text style={styles.contextMetricValue}>{prot}</Text>
          <Text style={styles.contextMetricLabel}>PROT</Text>
        </View>

        <View style={styles.contextSep} />

        <View style={styles.contextMetricCol}>
          <Text style={styles.contextMetricValue}>{water}</Text>
          <Text style={styles.contextMetricLabel}>ÁGUA</Text>
        </View>

        <View style={styles.contextSep} />

        <View style={styles.contextMetricCol}>
          <Text style={styles.contextMetricValue}>{fasting}</Text>
          <Text style={styles.contextMetricLabel}>JEJUM</Text>
        </View>
      </View>
    </View>
  );
}

export default function CoachScreen() {
  const { user, profile } = useAuthStore();
  const { log, meals } = useTodayData();
  const { activeFasting } = useFasting();
  const insets = useSafeAreaInsets();

  const welcomeMsg = useMemo<ChatMessage>(() => ({
    id: 'init-0',
    user_id: '',
    role: 'assistant',
    content: `Olá, ${profile?.name?.split(' ')[0] ?? 'Felipe'}. Analisei seu dia — você tem ${profile?.calories_target?.toLocaleString('pt-BR') ?? '2.205'} kcal disponíveis. Proteína merece atenção prioritária hoje.`,
    created_at: new Date().toISOString(),
  }), [profile?.name, profile?.calories_target]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMsg]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!user) {
      setHistoryLoaded(true);
      return;
    }
    if (historyLoaded) return;

    loadChatHistory(user.id, 30)
      .then((history) => {
        if (history.length > 0) {
          setMessages(history);
        }
        // se vazio, mantém a welcome message inicializada no useState
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistoryLoaded(true);
      });
  }, [user, historyLoaded, profile]);

  const kcalValue = useMemo(
    () =>
      log?.calories_consumed
        ? Math.round(log.calories_consumed).toLocaleString("pt-BR")
        : "0",
    [log?.calories_consumed]
  );

  const protValue = useMemo(
    () => `${Math.round(log?.protein_consumed ?? 0)}g`,
    [log?.protein_consumed]
  );

  const waterValue = useMemo(() => {
    const ml = log?.hydration_ml ?? 0;
    return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
  }, [log?.hydration_ml]);

  const fastingValue = useMemo(() => {
    if (!activeFasting?.started_at) return "--";
    const elapsed =
      (Date.now() - new Date(activeFasting.started_at).getTime()) / 3_600_000;
    const h = Math.floor(elapsed);
    const m = Math.floor((elapsed - h) * 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }, [activeFasting?.started_at]);

  const scoreValue = log?.score ?? 0;

  const chatContext = useMemo(
    () => ({
      totals: {
        calories: log?.calories_consumed ?? 0,
        protein: log?.protein_consumed ?? 0,
        carbs: log?.carbs_consumed ?? 0,
        fat: log?.fat_consumed ?? 0,
        fiber: 0,
      },
      goals: {
        calories: profile?.calories_target ?? 2100,
        protein: profile?.protein_target ?? 150,
      },
      mealNames: meals.map((m) => m.name).slice(0, 10),
    }),
    [log, profile, meals]
  );

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? inputText).trim();
      if (!content || isLoading) return;
      if (!user) return;

      setInputText("");

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        user_id: user.id,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        await persistMessage(user.id, "user", content);

        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;
        if (!session) {
          throw new Error("Não autenticado");
        }

        const apiBase =
          process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://nutriscan-ai.vercel.app/api";
        const response = await fetch(`${apiBase}/coach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...history, { role: "user", content }],
            context: chatContext,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({} as { error?: string }));
          throw new Error(err.error ?? `Erro ${response.status}`);
        }

        const data = (await response.json()) as { message?: string; content?: string };
        const reply = data.message ?? data.content ?? "";
        if (!reply) {
          throw new Error("Resposta vazia da Edge Function");
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          user_id: user.id,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        await persistMessage(user.id, "assistant", reply);
      } catch {
        const errMsg: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          user_id: user.id,
          role: "assistant",
          content: "Não consegui processar sua mensagem. Tente novamente.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [chatContext, inputText, isLoading, messages, user]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble msg={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const ListFooter = isLoading ? (
    <View style={styles.bubbleAssistantWrapper}>
      <View style={styles.bubbleAssistant}>
        <TypingIndicator />
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>C O N S U L T A</Text>
          <View style={styles.groqBadge}>
            <View style={styles.groqDot} />
            <Text style={styles.groqText}>GROQ ONLINE</Text>
          </View>
        </View>
      </View>

      <ContextCard
        kcal={kcalValue}
        prot={protValue}
        water={waterValue}
        fasting={fastingValue}
        score={scoreValue}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={!historyLoaded ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.t3} size="small" />
            </View>
          ) : ListFooter}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {messages.length <= 1 && historyLoaded ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            style={styles.chipsScroll}
          >
            {QUICK_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => sendMessage(chip)}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Pergunte ao Coach..."
            placeholderTextColor={Colors.t4}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage()}
          />

          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Text style={styles.sendArrowText}>›</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2A2840",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.serifLight,
    color: "#EBE4D2",
    letterSpacing: 8,
  },
  groqBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  groqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2D7A4F",
  },
  groqText: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: "#8A8070",
    letterSpacing: 2,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contextCard: {
    backgroundColor: Colors.c1,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.b1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  contextTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 9,
    color: Colors.t4,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  contextScore: {
    fontSize: 11,
    color: Colors.t3,
  },
  contextMetricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  contextMetricCol: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  contextMetricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.t1,
    fontVariant: ["tabular-nums"],
  },
  contextMetricLabel: {
    fontSize: 9,
    color: Colors.t4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contextSep: {
    width: 0.5,
    alignSelf: "stretch",
    backgroundColor: Colors.c3,
  },
  chatContent: {
    padding: 12,
    paddingBottom: 4,
    flexGrow: 1,
  },
  bubbleUserWrapper: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    marginVertical: 6,
  },
  bubbleUserLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: "#8A8070",
    letterSpacing: 2,
    textAlign: "right",
    marginBottom: 4,
  },
  bubbleUser: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 12,
  },
  bubbleUserText: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: "#EBE4D2",
    lineHeight: 20,
  },
  bubbleAssistantWrapper: {
    maxWidth: "85%",
    marginVertical: 6,
  },
  bubbleAssistantLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: "#8A8070",
    letterSpacing: 2,
    marginBottom: 4,
  },
  bubbleAssistant: {
    borderLeftWidth: 2,
    borderLeftColor: "#6B5FE4",
    paddingLeft: 12,
    paddingVertical: 10,
    paddingRight: 12,
    backgroundColor: "#12121F",
    borderRadius: 0,
  },
  bubbleAssistantText: {
    fontFamily: fonts.sansLight,
    fontSize: 14,
    fontStyle: "italic",
    color: "#EBE4D2",
    lineHeight: 22,
  },
  typingRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingVertical: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.t3,
  },
  chipsScroll: {
    maxHeight: 48,
    flexGrow: 0,
  },
  chipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#2A2840",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#12121F",
  },
  chipPressed: {
    borderColor: Colors.b2,
    backgroundColor: Colors.c1,
  },
  chipText: {
    fontFamily: fonts.sansLight,
    fontSize: 12,
    color: "#C8BFA8",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.b1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#12121F",
    borderWidth: 0.5,
    borderColor: "#2A2840",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.sansLight,
    color: "#EBE4D2",
    fontSize: 14,
    minHeight: 44,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6B5FE4",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  sendBtnPressed: {
    opacity: 0.8,
  },
  sendArrowText: {
    color: "#EBE4D2",
    fontSize: 24,
    lineHeight: 28,
  },
});
