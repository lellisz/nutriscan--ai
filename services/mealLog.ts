import { supabase } from '@/services/supabase';
import { DailyTotals } from '@/types';
import type { Tables, TablesInsert } from '@/types/database';

export type Meal = Tables<'meals'>;
export type MealType = NonNullable<Tables<'meals'>['meal_type']>;

function dayRange(date: string): { gte: string; lte: string } {
  return {
    gte: `${date}T00:00:00`,
    lte: `${date}T23:59:59`,
  };
}

/**
 * Busca todas as refeições registradas em uma data (lê de `meals`).
 */
export async function getMealsForDate(
  userId: string,
  date: string,
): Promise<Meal[]> {
  const { gte, lte } = dayRange(date);

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', gte)
    .lte('logged_at', lte)
    .order('logged_at', { ascending: true });

  if (error) throw error;

  return (data ?? []) as Meal[];
}

/**
 * Insere uma refeição manual em `meals` e atualiza/cria registro em `frequent_meals`.
 */
export async function logMeal(
  userId: string,
  input: {
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    meal_type: MealType;
    portion_multiplier?: number;
  },
): Promise<Meal> {
  if (!input.food_name || input.food_name.trim() === '') {
    throw new Error('"food_name" é obrigatório.');
  }
  if (!isFinite(input.calories) || input.calories < 0) {
    throw new Error('"calories" deve ser um número não negativo.');
  }
  if (!isFinite(input.protein) || input.protein < 0) {
    throw new Error('"protein" deve ser um número não negativo.');
  }
  if (!isFinite(input.carbs) || input.carbs < 0) {
    throw new Error('"carbs" deve ser um número não negativo.');
  }
  if (!isFinite(input.fat) || input.fat < 0) {
    throw new Error('"fat" deve ser um número não negativo.');
  }

  const portion = input.portion_multiplier ?? 1;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const name = input.food_name.trim();

  const insert: TablesInsert<'meals'> = {
    user_id: userId,
    date: today,
    name,
    calories: Math.round(input.calories * portion),
    protein: Number((input.protein * portion).toFixed(1)),
    carbs: Number((input.carbs * portion).toFixed(1)),
    fat: Number((input.fat * portion).toFixed(1)),
    fiber: input.fiber != null ? Number((input.fiber * portion).toFixed(1)) : null,
    meal_type: input.meal_type,
    logged_at: now.toISOString(),
    source: 'manual',
    confidence: 'alta',
  };

  const { data, error } = await supabase
    .from('meals')
    .insert(insert)
    .select()
    .single();

  if (error) throw error;

  // Atualiza frequent_meals (upsert por nome)
  const { data: existing } = await supabase
    .from('frequent_meals')
    .select('id, count')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('frequent_meals')
      .update({ count: (existing.count ?? 0) + 1, last_used: now.toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('frequent_meals').insert({
      user_id: userId,
      name,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      count: 1,
      last_used: now.toISOString(),
    });
  }

  return data as Meal;
}

export async function deleteMeal(
  userId: string,
  mealId: string,
): Promise<void> {
  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Soma os totais nutricionais do dia a partir das refeições registradas.
 * Como `meals` armazena valores já com porção aplicada, somamos diretamente.
 */
export async function getDailyTotals(
  userId: string,
  date: string,
): Promise<DailyTotals> {
  const meals = await getMealsForDate(userId, date);

  return meals.reduce<DailyTotals>(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein:  acc.protein  + (m.protein  ?? 0),
      carbs:    acc.carbs    + (m.carbs    ?? 0),
      fat:      acc.fat      + (m.fat      ?? 0),
      fiber:    acc.fiber    + (m.fiber    ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}
