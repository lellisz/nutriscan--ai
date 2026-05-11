import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Colors, fonts, fontSizes } from "@/constants/design";
import { sendChatMessage, loadChatHistory, persistMessage } from "@/services/chat";
import { useDailyNutrition } from "@/hooks/useNutrition";
import { useAuthStore } from "@/stores/authStore";
import { ChatMessage } from "@/types";

const QUICK_CHIPS = [
  "O que comer agora?",
  "Estou no déficit?",
  "Receita com proteína",
  "Como está meu dia?",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <View style={[bubStyles.wrapper, isUser ? bubStyles.wrapperUser : bubStyles.wrapperAssistant]}>
      {!isUser && <Text style={bubStyles.praxisLabel}>PRAXIS COACH</Text>}
      <View style={[bubStyles.bubble, isUser ? bubStyles.bubbleUser : bubStyles.bubbleAssistant]}>
        <Text style={[bubStyles.text, isUser ? bubStyles.textUser : bubStyles.textAssistant]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

const bubStyles = StyleSheet.create({
  wrapper: { marginVertical: 6, maxWidth: "85%" },
  wrapperUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapperAssistant: { alignSelf: "flex-start" },
  praxisLabel: { fontFamily: fonts.sansLight, fontSize: 9, color: Colors.gold, letterSpacing: 2, marginBottom: 4, marginLeft: 12 },
  bubble: { paddingHorizontal: 16, paddingVertical: 12 },
  bubbleUser: { backgroundColor: Colors.c1, borderWidth: 1, borderColor: Colors.b2 },
  bubbleAssistant: { borderLeftWidth: 2, borderLeftColor: Colors.gold, paddingLeft: 14 },
  text: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, lineHeight: 20 },
  textUser: { color: Colors.t1 },
  textAssistant: { color: Colors.t2 },
});

export default function ConsultScreen() {
  const { user } = useAuthStore();
  const { data: nutrition } = useDailyNutrition();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) return;
    loadChatHistory(user.id)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [user]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading || !user) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      await persistMessage(user.id, "user", content);

      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(
        [...history, { role: "user", content }],
        {
          totals: nutrition?.totals,
          goals: nutrition?.goals,
          mealNames: nutrition?.meals.map((m) => m.name),
        }
      );

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        role: "assistant",
        content: reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await persistMessage(user.id, "assistant", reply);
    } catch (e: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        role: "assistant",
        content: "Desculpe, não consegui processar sua mensagem. Tente novamente.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PRAXIS</Text>
          <Text style={styles.headerSub}>Coach Nutricional IA</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Mensagens */}
      {historyLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.t3} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.emptyChat}>
              <Text style={styles.emptyChatTitle}>Olá, sou o Coach PRAXIS</Text>
              <Text style={styles.emptyChatDesc}>
                Pergunte-me sobre seus dados de hoje, o que comer, receitas, ou qualquer dúvida nutricional.
              </Text>
            </Animated.View>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {loading && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>●●●</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Quick chips */}
      {messages.length === 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {QUICK_CHIPS.map((chip) => (
            <Pressable key={chip} style={styles.chip} onPress={() => handleSend(chip)}>
              <Text style={styles.chipText}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte ao Coach..."
          placeholderTextColor={Colors.t4}
          multiline
          maxLength={500}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          blurOnSubmit
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.sendBtnText}>→</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.b1 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backText: { fontFamily: fonts.sansLight, fontSize: fontSizes.lg, color: Colors.t1 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: fonts.serifLight, fontSize: fontSizes.lg, color: Colors.t1, letterSpacing: 4 },
  headerSub: { fontFamily: fonts.sansLight, fontSize: 10, color: Colors.t4, letterSpacing: 1 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 20, paddingVertical: 24, flexGrow: 1 },
  emptyChat: { paddingVertical: 40, gap: 12 },
  emptyChatTitle: { fontFamily: fonts.serifLight, fontSize: fontSizes.xl, color: Colors.t1 },
  emptyChatDesc: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3, lineHeight: 20 },
  typingIndicator: { alignSelf: "flex-start", paddingVertical: 8 },
  typingText: { fontFamily: fonts.monoLight, fontSize: fontSizes.sm, color: Colors.t4, letterSpacing: 4 },
  chipsScroll: { maxHeight: 48, flexGrow: 0 },
  chips: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.b1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3 },
  inputArea: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.b1, gap: 12, paddingBottom: 32 },
  input: { flex: 1, fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t1, minHeight: 40, maxHeight: 100, borderBottomWidth: 1, borderBottomColor: Colors.b2, paddingVertical: 8 },
  sendBtn: { width: 40, height: 40, backgroundColor: Colors.t1, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.3 },
  sendBtnText: { fontFamily: fonts.sansLight, fontSize: fontSizes.lg, color: Colors.bg },
});
