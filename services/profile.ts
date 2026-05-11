import { supabase } from "./supabase";
import { UserProfile, NutritionGoals, Goal, Sex, ActivityLevel } from "@/types";

// Mifflin-St Jeor BMR
function calculateBMR(weight: number, height: number, age: number, sex: Sex): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "M" ? base + 5 : base - 161;
}

export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  sex: Sex,
  activityLevel: ActivityLevel,
  goal: Goal
): number {
  const bmr = calculateBMR(weight, height, age, sex);
  const tdee = bmr * parseFloat(activityLevel);
  if (goal === "lose_weight") return Math.round(tdee - 500);
  if (goal === "gain_muscle") return Math.round(tdee + 300);
  return Math.round(tdee);
}

export function calculateMacros(calories: number, goal: Goal): Omit<NutritionGoals, "user_id" | "updated_at"> {
  const proteinRatio = goal === "gain_muscle" ? 0.35 : goal === "lose_weight" ? 0.30 : 0.25;
  const fatRatio = 0.25;
  const carbRatio = 1 - proteinRatio - fatRatio;

  const proteinCals = calories * proteinRatio;
  const fatCals = calories * fatRatio;
  const carbCals = calories * carbRatio;

  return {
    calories,
    protein: Math.round(proteinCals / 4),
    carbs: Math.round(carbCals / 4),
    fat: Math.round(fatCals / 9),
    fiber: 25,
  };
}

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export async function saveProfile(
  userId: string,
  data: {
    name: string;
    age: number;
    height_cm: number;
    weight_kg: number;
    target_weight_kg: number;
    gender: Sex;
    activity_level: ActivityLevel;
    goal: Goal;
    calories_target?: number;
    protein_target?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      user_id: userId,
      full_name: data.name,
      age: data.age,
      height: data.height_cm,
      weight: data.weight_kg,
      target_weight_kg: data.target_weight_kg,
      gender: data.gender,
      activity_level: parseFloat(data.activity_level),
      goal: data.goal,
      calories_target: data.calories_target,
      protein_target: data.protein_target,
    }, { onConflict: "user_id" });
  if (error) throw error;
}

/**
 * Persiste metas nutricionais como colunas em `profiles` (decisão v3).
 * A tabela legada `daily_goals` foi descontinuada; metas vivem agora em
 * `profiles.calories_target`, `profiles.protein_target`, `profiles.hydration_target`.
 *
 * Observação: `carbs`, `fat`, `fiber` ainda não existem como colunas
 * dedicadas em `profiles` — são derivados em runtime via `calculateMacros()`.
 */
export async function saveNutritionGoals(
  userId: string,
  goals: Omit<NutritionGoals, "user_id" | "updated_at">
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      calories_target: goals.calories,
      protein_target: goals.protein,
    })
    .eq("user_id", userId);
  if (error) throw error;
}

/**
 * Busca as metas nutricionais persistidas em `profiles`.
 * Retorna `null` se o perfil não existir.
 */
export async function getNutritionGoals(
  userId: string,
): Promise<Pick<NutritionGoals, "calories" | "protein"> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("calories_target, protein_target")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return {
    calories: data.calories_target ?? 0,
    protein: data.protein_target ?? 0,
  };
}
