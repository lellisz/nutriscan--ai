import { supabase } from '@/services/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyLog = Tables<'daily_logs'>;
export type Meal = Tables<'meals'>;
export type FrequentMealRow = Tables<'frequent_meals'>;

export interface FrequentMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Busca o log do dia atual. Se não existir, cria um com valores zerados.
 */
export async function getTodayLog(userId: string): Promise<DailyLog | null> {
  const today = todayISO();

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as DailyLog;

  // Cria log do dia se não existir
  const { data: created, error: createError } = await supabase
    .from('daily_logs')
    .insert({
      user_id: userId,
      date: today,
      context: 'normal',
      score: 0,
      calories_consumed: 0,
      protein_consumed: 0,
      carbs_consumed: 0,
      fat_consumed: 0,
      hydration_ml: 0,
      sleep_hours: 0,
    })
    .select()
    .single();

  if (createError) throw createError;

  return created as DailyLog;
}

/**
 * Upsert do log do dia atual.
 */
export async function upsertDailyLog(
  userId: string,
  data: Partial<DailyLog>,
): Promise<void> {
  const today = todayISO();

  const { error } = await supabase
    .from('daily_logs')
    .upsert(
      { ...data, user_id: userId, date: today },
      { onConflict: 'user_id,date' },
    );

  if (error) throw error;
}

/**
 * Atualiza dados de sono no log do dia (cria o log se necessário).
 */
export async function upsertSleepData(
  userId: string,
  hours: number,
  quality?: number,
): Promise<void> {
  if (!isFinite(hours) || hours < 0 || hours > 24) {
    throw new Error('"hours" deve ser um número entre 0 e 24.');
  }
  if (quality != null && (!isFinite(quality) || quality < 1 || quality > 10)) {
    throw new Error('"quality" deve ser um número entre 1 e 10.');
  }

  const patch: TablesUpdate<'daily_logs'> = {
    sleep_hours: hours,
    ...(quality != null ? { sleep_quality: quality } : {}),
  };

  await upsertDailyLog(userId, patch as Partial<DailyLog>);
}

/**
 * Atualiza humor (mood 1-5) e nível de energia (1-10) no log do dia.
 */
export async function upsertMoodEnergy(
  userId: string,
  mood: number,
  energy: number,
): Promise<void> {
  if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
    throw new Error('"mood" deve ser um inteiro entre 1 e 5.');
  }
  if (!Number.isInteger(energy) || energy < 1 || energy > 10) {
    throw new Error('"energy" deve ser um inteiro entre 1 e 10.');
  }

  await upsertDailyLog(userId, {
    mood,
    energy_level: energy,
  } as Partial<DailyLog>);
}

/**
 * Busca todas as refeições do dia atual (de `meals`).
 */
export async function getTodayMeals(userId: string): Promise<Meal[]> {
  const today = todayISO();

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('logged_at', { ascending: true });

  if (error) throw error;

  return (data ?? []) as Meal[];
}

/**
 * Adiciona uma refeição em `meals` e atualiza/cria o frequent_meals correspondente.
 * Valida campos obrigatórios antes de inserir.
 */
export async function addMeal(
  userId: string,
  meal: {
    name: string;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  },
): Promise<void> {
  // Validação de campos obrigatórios
  if (!meal.name || typeof meal.name !== 'string' || meal.name.trim() === '') {
    throw new Error('O campo "name" é obrigatório e deve ser uma string não vazia.');
  }
  if (typeof meal.calories !== 'number' || meal.calories < 0 || !isFinite(meal.calories)) {
    throw new Error('O campo "calories" deve ser um número não negativo.');
  }
  if (typeof meal.protein !== 'number' || meal.protein < 0 || !isFinite(meal.protein)) {
    throw new Error('O campo "protein" deve ser um número não negativo.');
  }
  if (typeof meal.carbs !== 'number' || meal.carbs < 0 || !isFinite(meal.carbs)) {
    throw new Error('O campo "carbs" deve ser um número não negativo.');
  }
  if (typeof meal.fat !== 'number' || meal.fat < 0 || !isFinite(meal.fat)) {
    throw new Error('O campo "fat" deve ser um número não negativo.');
  }
  if (!meal.date || typeof meal.date !== 'string') {
    throw new Error('O campo "date" é obrigatório.');
  }
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
  if (!validMealTypes.includes(meal.meal_type)) {
    throw new Error('O campo "meal_type" deve ser breakfast, lunch, dinner ou snack.');
  }

  const { error } = await supabase.from('meals').insert({
    user_id: userId,
    name: meal.name,
    date: meal.date,
    meal_type: meal.meal_type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber ?? null,
    logged_at: new Date().toISOString(),
  });

  if (error) throw error;

  // Atualiza refeições frequentes (upsert por nome)
  const { data: existing } = await supabase
    .from('frequent_meals')
    .select('id, count')
    .eq('user_id', userId)
    .eq('name', meal.name)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('frequent_meals')
      .update({ count: (existing.count ?? 0) + 1, last_used: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('frequent_meals').insert({
      user_id: userId,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      count: 1,
      last_used: new Date().toISOString(),
    });
  }
}

/**
 * Busca os logs dos últimos 7 dias com date, sleep_hours e score.
 */
export async function getLast7DaysLogs(
  userId: string,
): Promise<Pick<DailyLog, 'date' | 'sleep_hours' | 'score'>[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('date, sleep_hours, score')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(7);

  if (error) throw error;

  return (data ?? []) as Pick<DailyLog, 'date' | 'sleep_hours' | 'score'>[];
}

/**
 * Busca as 5 refeições mais frequentes do usuário.
 */
export async function getFrequentMeals(userId: string): Promise<FrequentMeal[]> {
  const { data, error } = await supabase
    .from('frequent_meals')
    .select('id, name, calories, protein, count')
    .eq('user_id', userId)
    .order('count', { ascending: false })
    .limit(5);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    count: row.count ?? 0,
  }));
}
