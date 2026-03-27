// Nudges proativos do Coach Praxi
// Rate limit: 1 nudge a cada 3 horas (localStorage)
//
// Fluxo:
//   1. canShowNudge() verifica cooldown de 3h
//   2. isNudgeDismissed() verifica se o usuário dispensou recentemente
//   3. getNudge() avalia as condições na ordem de prioridade e retorna o primeiro nudge aplicável
//   4. generateGroqNudge() chama /api/chat para gerar mensagem personalizada via LLaMA 8B instant
//      — o modelo 8B é suficiente para mensagens curtas e reduz latência/custo

const LAST_NUDGE_KEY = 'praxis_last_nudge';
const DISMISSED_KEY  = 'praxis_nudge_dismissed';
const NUDGE_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 horas

function canShowNudge() {
  try {
    const last = localStorage.getItem(LAST_NUDGE_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > NUDGE_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markNudgeShown() {
  try {
    localStorage.setItem(LAST_NUDGE_KEY, Date.now().toString());
  } catch { /* ignora se localStorage não disponível */ }
}

export function dismissNudge() {
  try {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  } catch { /* ignora */ }
}

function isNudgeDismissed() {
  try {
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (!ts) return false;
    // Dispensado há menos de 3h — não mostrar novamente neste período
    return Date.now() - parseInt(ts, 10) < NUDGE_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function sanitize(text) {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// Chama o Groq via endpoint /api/chat existente no projeto.
// Usa llama-3.1-8b-instant: rápido e barato para mensagens curtas (max_tokens: 80).
// Retorna null em qualquer falha — o caller usa o fallback hardcoded.
async function generateGroqNudge(prompt) {
  try {
    // Import dinâmico evita circular dependency; getSupabaseClient() é singleton
    const { getSupabaseClient } = await import('../supabase.js');
    const { data: { session } } = await getSupabaseClient().auth.getSession();
    const token = session?.access_token;
    if (!token) return null;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        max_tokens: 80,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    // /api/chat pode retornar reply, message ou content dependendo da versão
    return sanitize(data?.reply || data?.message || data?.content || '');
  } catch {
    return null;
  }
}

/**
 * Determina o nudge a mostrar, ou null se nenhum se aplica.
 *
 * A ordem de prioridade reflete urgência:
 *   1. Calorias restantes altas à noite   — risco de fechar o dia abaixo da meta
 *   2. Proteína baixa à tarde             — janela anabólica se encerrando
 *   3. Hidratação baixa à tarde           — alerta fisiológico simples
 *   4. Streak em risco                    — motivação por perda (loss aversion)
 *   5. Re-add inteligente                 — conveniência / hábito
 *
 * @param {Object} userData
 * @param {string} userData.name
 * @param {number} userData.hour
 * @param {number} userData.caloriesGoal
 * @param {number} userData.caloriesConsumed
 * @param {number} userData.proteinGoal
 * @param {number} userData.proteinConsumed
 * @param {number} userData.hydrationGoal        - em ml
 * @param {number} userData.hydrationConsumed    - em ml
 * @param {number} userData.streakDays
 * @param {number} userData.todayMealsCount
 * @param {string} [userData.lastMealName]
 * @returns {Promise<{type: string, message: string, actionLabel?: string, actionData?: object} | null>}
 */
export async function getNudge(userData) {
  if (!canShowNudge() || isNudgeDismissed()) return null;

  const {
    name,
    hour,
    caloriesGoal,
    caloriesConsumed,
    proteinGoal,
    proteinConsumed,
    hydrationGoal,
    hydrationConsumed,
    streakDays,
    todayMealsCount,
    lastMealName,
  } = userData;

  const caloriesRemaining = caloriesGoal - caloriesConsumed;
  const proteinPct  = proteinGoal  > 0 ? Math.round((proteinConsumed  / proteinGoal)  * 100) : 100;
  const hydrationPct = hydrationGoal > 0 ? Math.round((hydrationConsumed / hydrationGoal) * 100) : 100;

  // ── TIPO 1 — Calorias: muitas restantes à noite ───────────────────────────
  // Condição: mais de 600 kcal restantes depois das 19h com pelo menos 1 refeição registrada.
  // Não disparar se o usuário não registrou nada ainda (pode ser início do dia tardio).
  if (caloriesRemaining > 600 && hour > 19 && todayMealsCount > 0) {
    const fallback = `Ainda dá tempo de fechar o dia bem, ${name}. Que tal registrar o jantar agora?`;
    const prompt =
      `Você é o Coach Praxi, nutricionista amigável. O usuário se chama ${name}. ` +
      `São ${hour}h e ele ainda tem ${caloriesRemaining}kcal para consumir hoje (meta: ${caloriesGoal}kcal). ` +
      `Escreva UMA mensagem curta (máximo 2 frases) encorajando-o a registrar o jantar. ` +
      `Tom: acolhedor, prático. Não use emojis. Não seja genérico.`;
    const message = (await generateGroqNudge(prompt)) || fallback;
    markNudgeShown();
    return { type: 'calorie', message };
  }

  // ── TIPO 2 — Proteína baixa à tarde ──────────────────────────────────────
  // Condição: menos de 40% da meta de proteína depois das 15h.
  // Janela para correção ainda é viável com lanche proteico.
  if (proteinPct < 40 && hour > 15) {
    const fallback = `${name}, você ainda está abaixo na proteína hoje. Um frango grelhado ou ovo pode ajudar.`;
    const prompt =
      `Você é o Coach Praxi. O usuário ${name} consumiu apenas ${proteinPct}% da meta de proteína hoje ` +
      `(${proteinConsumed}g de ${proteinGoal}g). São ${hour}h. ` +
      `Escreva UMA mensagem curta sugerindo um alimento proteico para o restante do dia. ` +
      `Mencione um alimento concreto. Máximo 2 frases. Sem emojis.`;
    const message = (await generateGroqNudge(prompt)) || fallback;
    markNudgeShown();
    return { type: 'protein', message };
  }

  // ── TIPO 3 — Hidratação baixa à tarde ────────────────────────────────────
  // Condição: menos de 60% da meta de hidratação depois das 14h.
  // Mensagem aleatória entre 3 variações para evitar repetição mecânica.
  if (hydrationPct < 60 && hour > 14) {
    const msgs = [
      `Você está um pouco atrás na hidratação hoje. Um copo d'água agora faz diferença.`,
      `Lembrete de hidratação: você atingiu ${hydrationPct}% da meta. Que tal um copo agora?`,
      `O corpo agradece quando você se lembra de hidratar. Ainda dá para chegar perto da meta hoje!`,
    ];
    const message = msgs[Math.floor(Math.random() * msgs.length)];
    markNudgeShown();
    return { type: 'hydration', message, actionLabel: '+1 copo' };
  }

  // ── TIPO 4 — Streak em risco ──────────────────────────────────────────────
  // Condição: 3+ dias de streak, nenhuma refeição registrada hoje, já passou do meio-dia.
  // Loss aversion: mencionar o streak explicitamente aumenta a taxa de conversão.
  if (streakDays >= 3 && todayMealsCount === 0 && hour > 12) {
    const message = `Seu streak de ${streakDays} dias está em jogo. Registre qualquer refeição de hoje para manter a sequência!`;
    markNudgeShown();
    return { type: 'streak', message, actionLabel: 'Registrar agora' };
  }

  // ── TIPO 5 — Re-add inteligente ───────────────────────────────────────────
  // Condição: tem refeição de ontem, sem refeição hoje ainda, entre 7h e 21h.
  // Friction mínimo: o usuário provavelmente come de forma repetida em dias de semana.
  if (lastMealName && todayMealsCount === 0 && hour >= 7 && hour <= 21) {
    const message = `Ontem você comeu "${lastMealName}" neste horário. Quer registrar de novo?`;
    markNudgeShown();
    return {
      type: 'readd',
      message,
      actionLabel: 'Registrar',
      actionData: { foodName: lastMealName },
    };
  }

  return null;
}
