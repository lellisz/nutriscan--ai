// supabase/functions/daily-insights/index.ts
// Gerador de insights diários acionáveis.
// Modo 1 (POST + body { user_id, date }): user-JWT (próprio user) ou service_role.
// Modo 2 (POST sem body, ou body vazio): cron — processa TODOS users com daily_logs do dia anterior. Exige service_role.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SupabaseClient } from 'npm:@supabase/supabase-js';
import { getServiceClient, isServiceRoleToken } from '../_shared/auth.ts';
import { callGroq, extractJson } from '../_shared/groq.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type InsightKind = 'nutrition' | 'sleep' | 'activity' | 'glucose' | 'behavior';

interface Insight {
  kind: InsightKind;
  title: string;
  body: string;
  priority: 0 | 1 | 2;
}

const VALID_KINDS: InsightKind[] = ['nutrition', 'sleep', 'activity', 'glucose', 'behavior'];

const SYSTEM_PROMPT = `Você é um analista nutricional e de comportamento. Receberá um resumo dos últimos dias do usuário e gerará 3 insights ACIONÁVEIS para HOJE.

Responda EXCLUSIVAMENTE em JSON válido, sem markdown, no formato:
{"insights":[{"kind":"nutrition|sleep|activity|glucose|behavior","title":"max 40 chars","body":"max 140 chars","priority":0|1|2}]}

Regras:
- Sempre exatamente 3 insights, com kinds diversos quando possível
- "title" curto, sem emojis, sem ponto final
- "body" frase única em pt-BR, ação concreta ("Beba 500ml de água antes do almoço")
- "priority": 2 = urgente/importante (déficit grave, padrão de risco), 1 = recomendado, 0 = sugestão leve
- Não use linguagem de dieta restritiva ou punitiva
- Foque no que pode ser feito HOJE`;

function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function yesterdayISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function clampStr(s: unknown, max: number): string {
  return String(s ?? '').slice(0, max);
}

function sanitizeInsights(raw: unknown): Insight[] {
  if (!raw || typeof raw !== 'object') return [];
  const arr = (raw as { insights?: unknown }).insights;
  if (!Array.isArray(arr)) return [];
  const out: Insight[] = [];
  for (const it of arr.slice(0, 3)) {
    if (!it || typeof it !== 'object') continue;
    const obj = it as Record<string, unknown>;
    const kind = VALID_KINDS.includes(obj.kind as InsightKind)
      ? (obj.kind as InsightKind)
      : 'nutrition';
    const priority = ([0, 1, 2].includes(Number(obj.priority))
      ? Number(obj.priority)
      : 1) as 0 | 1 | 2;
    out.push({
      kind,
      title: clampStr(obj.title, 40),
      body: clampStr(obj.body, 140),
      priority,
    });
  }
  return out;
}

interface Context {
  daily_logs: Array<Record<string, unknown>>;
  meals: Array<Record<string, unknown>>;
  patterns: Array<Record<string, unknown>>;
}

async function gatherContext(supabase: SupabaseClient, userId: string): Promise<Context> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(now.getUTCDate() - 7);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setUTCDate(now.getUTCDate() - 3);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(now.getUTCDate() - 30);

  const [logsR, mealsR, patternsR] = await Promise.allSettled([
    supabase
      .from('daily_logs')
      .select('date,score,calories_consumed,protein_consumed,hydration_ml,sleep_hours,context')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('meals')
      .select('date,meal_type,name,calories,protein,carbs,fat')
      .eq('user_id', userId)
      .gte('date', threeDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('behavior_patterns')
      .select('pattern_type,description,detected_at')
      .eq('user_id', userId)
      .gte('detected_at', thirtyDaysAgo.toISOString())
      .order('detected_at', { ascending: false })
      .limit(10),
  ]);

  const extract = <T>(r: PromiseSettledResult<{ data: T[] | null }>): T[] =>
    r.status === 'fulfilled' && Array.isArray(r.value?.data) ? r.value.data : [];

  return {
    daily_logs: extract(logsR),
    meals: extract(mealsR),
    patterns: extract(patternsR),
  };
}

function buildContextSummary(ctx: Context): string {
  const lines: string[] = [];

  if (ctx.daily_logs.length > 0) {
    lines.push('## DAILY_LOGS (mais recentes primeiro):');
    for (const l of ctx.daily_logs) {
      lines.push(
        `- ${l.date} | score=${l.score ?? '-'} | kcal=${l.calories_consumed ?? '-'} | prot=${l.protein_consumed ?? '-'}g | hidro=${l.hydration_ml ?? '-'}ml | sono=${l.sleep_hours ?? '-'}h | ctx=${l.context ?? '-'}`
      );
    }
  } else {
    lines.push('## DAILY_LOGS: vazio (sem registros)');
  }

  if (ctx.meals.length > 0) {
    lines.push('\n## MEALS (últimos 3 dias):');
    const byDate = new Map<string, Array<Record<string, unknown>>>();
    for (const m of ctx.meals) {
      const d = String(m.date ?? '');
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(m);
    }
    for (const [d, ms] of byDate) {
      const totalKcal = ms.reduce((s, m) => s + Number(m.calories ?? 0), 0);
      const totalProt = ms.reduce((s, m) => s + Number(m.protein ?? 0), 0);
      lines.push(`- ${d}: ${ms.length} refeições, ${totalKcal}kcal, ${totalProt.toFixed(0)}g prot`);
    }
  }

  if (ctx.patterns.length > 0) {
    lines.push('\n## PADRÕES DETECTADOS:');
    for (const p of ctx.patterns.slice(0, 5)) {
      lines.push(`- ${p.pattern_type}: ${p.description}`);
    }
  }

  // limita a ~1500 chars
  let summary = lines.join('\n');
  if (summary.length > 1500) summary = summary.slice(0, 1500) + '...[truncated]';
  return summary;
}

async function generateInsightsForUser(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<Insight[]> {
  const ctx = await gatherContext(supabase, userId);
  const summary = buildContextSummary(ctx);

  const raw = await callGroq(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Data de hoje: ${date}\n\nContexto:\n${summary}\n\nGere os 3 insights agora.`,
      },
    ],
    {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }
  );

  const parsed = extractJson(raw);
  let insights = sanitizeInsights(parsed);

  // Garantir 3 insights mesmo em fallback
  while (insights.length < 3) {
    insights.push({
      kind: 'nutrition',
      title: 'Hidrate-se bem hoje',
      body: 'Beba água ao longo do dia, alvo de 2L distribuídos em refeições e intervalos.',
      priority: 0,
    });
  }
  return insights.slice(0, 3);
}

async function persistInsights(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  insights: Insight[]
): Promise<void> {
  const rows = insights.map((i) => ({
    user_id: userId,
    date,
    kind: i.kind,
    title: i.title,
    body: i.body,
    priority: i.priority,
  }));
  const { error } = await supabase.from('daily_insights').insert(rows);
  if (error) {
    console.warn(`[daily-insights] insert failed user=${userId}:`, error.message);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

  const isAdmin = isServiceRoleToken(req);
  const supabase = getServiceClient();

  // Parse body (pode ser vazio para cron)
  let body: { user_id?: string; date?: string } = {};
  try {
    const text = await req.text();
    if (text.trim().length > 0) body = JSON.parse(text);
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const targetDate = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayISO();

  // ─── MODO 1: USER ESPECÍFICO ───────────────────────────────────────────────
  if (body.user_id) {
    let allowedUserId: string | null = null;

    if (isAdmin) {
      allowedUserId = body.user_id;
    } else {
      // user JWT — só pode pedir para si mesmo
      const { data: { user }, error } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '').trim()
      );
      if (error || !user) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (user.id !== body.user_id) return jsonResponse({ error: 'Forbidden' }, 403);
      allowedUserId = user.id;
    }

    try {
      const insights = await generateInsightsForUser(supabase, allowedUserId, targetDate);
      await persistInsights(supabase, allowedUserId, targetDate, insights);
      return jsonResponse({ count: insights.length, insights, date: targetDate });
    } catch (err) {
      console.error('[daily-insights] mode1 error:', (err as Error).message);
      return jsonResponse({ error: 'Failed to generate insights' }, 500);
    }
  }

  // ─── MODO 2: CRON (todos users com daily_log de ontem) ─────────────────────
  if (!isAdmin) {
    return jsonResponse({ error: 'Forbidden: cron mode requires service_role' }, 403);
  }

  try {
    const yday = yesterdayISO();
    const { data: rows, error } = await supabase
      .from('daily_logs')
      .select('user_id')
      .eq('date', yday);

    if (error) {
      console.error('[daily-insights] cron query failed:', error.message);
      return jsonResponse({ error: 'Failed to fetch users' }, 500);
    }

    const userIds = Array.from(new Set((rows ?? []).map((r) => String(r.user_id)).filter(Boolean)));
    const cronDate = todayISO();
    const results: Array<{ user_id: string; ok: boolean; count: number; error?: string }> = [];

    for (const uid of userIds) {
      try {
        const insights = await generateInsightsForUser(supabase, uid, cronDate);
        await persistInsights(supabase, uid, cronDate, insights);
        results.push({ user_id: uid, ok: true, count: insights.length });
      } catch (err) {
        results.push({ user_id: uid, ok: false, count: 0, error: (err as Error).message });
      }
    }

    return jsonResponse({
      mode: 'cron',
      date: cronDate,
      total_users: userIds.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    console.error('[daily-insights] cron error:', (err as Error).message);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
