import { supabase } from "./supabase";
import { ScanApiResponse } from "@/types";
import type { Tables, TablesInsert } from "@/types/database";
import { Platform } from "react-native";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://nutriscan-ai.vercel.app/api";

export type MealType = NonNullable<Tables<'meals'>['meal_type']>;
export type SavedMeal = Tables<'meals'>;

// Redimensiona a imagem para max 1024px e retorna base64
export async function prepareImage(uri: string): Promise<{ base64: string; mediaType: string }> {
  if (Platform.OS === "web") {
    // Na web, converte a URI para base64 via fetch
    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(blob);
    });
    return { base64, mediaType: "image/jpeg" };
  }

  const ImageManipulator = await import("expo-image-manipulator");
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return {
    base64: resized.base64!,
    mediaType: "image/jpeg",
  };
}

// Envia para api/scan.js via Vercel (nunca chama Gemini diretamente no app)
export async function analyzeFood(imageUri: string): Promise<ScanApiResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  const { base64, mediaType } = await prepareImage(imageUri);

  const response = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ imageBase64: base64, mediaType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Erro ${response.status}`);
  }

  return response.json();
}

/**
 * Histórico cru de scans (toda análise — confirmada ou não).
 * Vai para `food_logs` para preservar o registro bruto.
 */
export async function recordScanHistory(
  userId: string,
  result: ScanApiResponse,
): Promise<void> {
  const insert: TablesInsert<'food_logs'> = {
    user_id: userId,
    name: result.food_name,
    food_name: result.food_name,
    calories: result.calories,
    protein: result.protein,
    carbs: result.carbs,
    fat: result.fat,
    logged_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("food_logs").insert(insert);
  if (error) throw error;
}

/**
 * Salva uma refeição confirmada pelo usuário em `meals` (schema v3).
 * Decisão: scans confirmados viram refeições oficiais; histórico cru fica em `food_logs`.
 */
export async function saveMeal(
  userId: string,
  result: ScanApiResponse,
  options: {
    imageUrl?: string;
    portionMultiplier?: number;
    mealType?: MealType;
  } = {}
): Promise<SavedMeal> {
  const portion = options.portionMultiplier ?? 1.0;
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const insert: TablesInsert<'meals'> = {
    user_id: userId,
    date: today,
    name: result.food_name,
    calories: Math.round((result.calories ?? 0) * portion),
    protein: Number(((result.protein ?? 0) * portion).toFixed(1)),
    carbs: Number(((result.carbs ?? 0) * portion).toFixed(1)),
    fat: Number(((result.fat ?? 0) * portion).toFixed(1)),
    fiber: result.fiber != null ? Number((result.fiber * portion).toFixed(1)) : null,
    meal_type: options.mealType ?? detectMealType(),
    logged_at: now.toISOString(),
    image_url: options.imageUrl ?? null,
    confidence: result.confidence ?? null,
    source: "gemini",
  };

  const { error, data } = await supabase
    .from("meals")
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data as SavedMeal;
}

function detectMealType(): MealType {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 20) return "dinner";
  return "snack";
}
