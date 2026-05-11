// Alinhado com o schema SQL real do Supabase (nutriscan/supabase/schema.sql)

export type Goal = "lose_weight" | "gain_muscle" | "maintain";
export type Sex = "M" | "F";
export type ActivityLevel = "1.2" | "1.375" | "1.55" | "1.725" | "1.9";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  "1.2": "Sedentário",
  "1.375": "Levemente ativo",
  "1.55": "Moderadamente ativo",
  "1.725": "Muito ativo",
  "1.9": "Extremamente ativo",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: "Perder peso",
  gain_muscle: "Ganhar músculo",
  maintain: "Manter a forma",
};

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  gender: Sex;
  activity_level: ActivityLevel;
  goal: Goal;
  // v3 fields
  calories_target?: number;
  protein_target?: number;
  hydration_target?: number;
  compassion_mode?: boolean;
  quiet_intelligence?: boolean;
  adaptive_goals?: boolean;
  nutrition_memory?: boolean;
  reminder_lunch_hour?: number;
  reminder_dinner_hour?: number;
  reminders_enabled?: boolean;
}

export interface NutritionGoals {
  user_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  updated_at: string;
}

// scan_history table — campos reais do schema
export interface ScanHistoryItem {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  confidence: "alta" | "media" | "baixa";
  benefits?: string;
  watch_out?: string;
  ai_tip?: string;
  verdict?: string;
  next_action?: string;
  image_url?: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
  portion_multiplier: number;
  identified_by: "gemini" | "manual" | "gallery";
  created_at: string;
  logged_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  bmi: number;
  date: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface GeminiResponse {
  meal_name: string;
  confidence: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  alternative_suggestions?: string[];
}

// Resposta completa do api/scan.js
export interface ScanApiResponse {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  confidence: "alta" | "media" | "baixa";
  benefits?: string;
  watch_out?: string;
  ai_tip?: string;
  verdict?: string;
  next_action?: string;
}
