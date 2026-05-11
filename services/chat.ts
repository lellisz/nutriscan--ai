import { supabase } from "./supabase";
import { ChatMessage, NutritionGoals, DailyTotals } from "@/types";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://nutriscan-ai.vercel.app/api";

export async function sendChatMessage(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: { totals?: DailyTotals; goals?: Partial<NutritionGoals> | null; mealNames?: string[] }
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Erro ${response.status}`);
  }

  const data = await response.json();
  return data.message ?? data.content ?? "";
}

export async function loadChatHistory(userId: string, limit = 20): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("coach_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function persistMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const { error } = await supabase.from("coach_messages").insert({ user_id: userId, role, content });
  if (error) throw error;
}
