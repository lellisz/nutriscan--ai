// supabase/functions/glucose-predict/index.ts
// Prediz pico glicêmico pós-refeição via heurística + Gemini para refinar recomendação.
// Auth: JWT obrigatório.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getUserFromAuthHeader } from '../_shared/auth.ts';
import { callGemini, isGeminiAvailable } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MealInput {
  calories?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

interface ContextInput {
  hours_since_last_meal?: number;
  exercise_today_min?: number;
  sleep_hours_last_night?: number;
  stress_level?: number; // 1-5
}

interface PredictBody {
  meal?: MealInput;
  context?: ContextInput;
}

function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function num(v: unknown, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface HeuristicResult {
  peak_mmol: number;
  auc: number;
  delta: number;
  sleep_penalty: number;
  stress_penalty: number;
  exercise_bonus: number;
}

function heuristicPredict(meal: MealInput, ctx: ContextInput): HeuristicResult {
  const carbs = num(meal.carbs_g);
  const protein = num(meal.protein_g);
  const fat = num(meal.fat_g);
  const fiber = num(meal.fiber_g);

  const sleepH = num(ctx.sleep_hours_last_night, 7);
  const stress = num(ctx.stress_level, 1);
  const exerciseMin = num(ctx.exercise_today_min);

  const base = 5.5;
  const delta = carbs * 0.04 - fiber * 0.05 - protein * 0.01 - fat * 0.005;
  const sleep_penalty = sleepH < 6 ? 0.4 : 0;
  const stress_penalty = stress >= 4 ? 0.3 : 0;
  const exercise_bonus = exerciseMin > 30 ? -0.4 : 0;

  const rawPeak = base + delta + sleep_penalty + stress_penalty + exercise_bonus;
  const peak_mmol = clamp(rawPeak, 4.0, 12.0);

  // AUC simplificado: área triangular base=1.5h, altura=peak (acima de jejum)
  // Mais útil reportar a "extra-AUC" acima do baseline (5.5).
  const above = Math.max(0, peak_mmol - 5.5);
  const auc = Number((above * 1.5).toFixed(2));

  return {
    peak_mmol: Number(peak_mmol.toFixed(2)),
    auc,
    delta: Number(delta.toFixed(2)),
    sleep_penalty,
    stress_penalty,
    exercise_bonus,
  };
}

function heuristicRecommendation(h: HeuristicResult, ctx: ContextInput): string {
  const peak = h.peak_mmol;
  const fiberLow = true; // não temos meal aqui; chamamos com fiber baixa indiretamente
  let advice: string;

  if (peak >= 9.0) {
    advice = 'Considere caminhar 15min após a refeição';
  } else if (peak >= 7.5) {
    advice = num(ctx.exercise_today_min) < 30
      ? 'Caminhada leve de 10min ajuda a controlar o pico'
      : 'Adicione fibras na próxima refeição';
  } else if (peak <= 5.5) {
    advice = 'Bom equilíbrio — mantenha o padrão';
  } else {
    advice = 'Adicione fibras na próxima refeição';
  }

  const msg = `Pico estimado ${peak.toFixed(1)} mmol/L. ${advice}.`;
  return msg.slice(0, 100);
}

async function refineWithGemini(
  meal: MealInput,
  ctx: ContextInput,
  h: HeuristicResult
): Promise<string | null> {
  if (!isGeminiAvailable()) return null;

  const prompt = `Você é um educador glicêmico. Gere UMA recomendação curta em pt-BR (max 100 caracteres, sem emoji, sem ponto final no fim) para o usuário.

Refeição: ${num(meal.calories)}kcal, ${num(meal.carbs_g)}g carb, ${num(meal.protein_g)}g prot, ${num(meal.fat_g)}g gord, ${num(meal.fiber_g)}g fibra.
Contexto: ${num(ctx.hours_since_last_meal)}h sem comer, ${num(ctx.exercise_today_min)}min exercício hoje, ${num(ctx.sleep_hours_last_night, 7)}h sono, stress nível ${num(ctx.stress_level, 1)}/5.
Pico previsto: ${h.peak_mmol.toFixed(1)} mmol/L.

Retorne apenas a frase, sem prefixos como "Recomendação:".`;

  const text = await callGemini(prompt, {
    model: 'gemini-2.5-flash-exp',
    maxOutputTokens: 80,
    temperature: 0.5,
  });
  if (!text) return null;
  // Limpar e clampar
  const clean = text.replace(/^[\s"'`*]+|[\s"'`*]+$/g, '').slice(0, 100);
  return clean.length > 0 ? clean : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // 1. AUTH
  let auth;
  try {
    auth = await getUserFromAuthHeader(req, corsHeaders);
  } catch (resp) {
    return resp instanceof Response ? resp : jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { user_id, supabase } = auth;

  try {
    // 2. PARSE BODY
    let body: PredictBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const meal: MealInput = body.meal ?? {};
    const ctx: ContextInput = body.context ?? {};

    // Validação mínima
    if (
      meal.carbs_g === undefined &&
      meal.calories === undefined &&
      meal.protein_g === undefined &&
      meal.fat_g === undefined
    ) {
      return jsonResponse({ error: 'meal must contain at least one macro field' }, 400);
    }

    // 3. HEURÍSTICA
    const h = heuristicPredict(meal, ctx);

    // 4. RECOMMENDATION (Gemini → fallback heurístico)
    let recommendation = await refineWithGemini(meal, ctx, h);
    if (!recommendation) {
      recommendation = heuristicRecommendation(h, ctx);
    }

    const predicted_at = new Date().toISOString();

    // 5. PERSIST
    const persistRow = {
      user_id,
      meal_calories: num(meal.calories),
      meal_carbs_g: num(meal.carbs_g),
      meal_protein_g: num(meal.protein_g),
      meal_fat_g: num(meal.fat_g),
      meal_fiber_g: num(meal.fiber_g),
      hours_since_last_meal: num(ctx.hours_since_last_meal),
      exercise_today_min: num(ctx.exercise_today_min),
      sleep_hours_last_night: num(ctx.sleep_hours_last_night, 7),
      stress_level: num(ctx.stress_level, 1),
      peak_mmol: h.peak_mmol,
      auc: h.auc,
      recommendation,
      predicted_at,
    };

    const { error: insertError } = await supabase.from('glucose_predictions').insert(persistRow);
    if (insertError) {
      console.warn(`[glucose-predict] insert failed user=${user_id}:`, insertError.message);
      // não falhar a request por causa disso
    }

    return jsonResponse({
      peak_mmol: h.peak_mmol,
      auc: h.auc,
      recommendation,
      predicted_at,
    });
  } catch (err) {
    console.error('[glucose-predict] error:', (err as Error).message);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
