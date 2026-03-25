/**
 * Praxis Nutri — Session Memory
 * Extrai insights ao fim de cada conversa (Gemini Flash Lite — ultra barato)
 * e os injeta no system prompt da próxima sessão.
 *
 * NOTA: Este módulo roda no BACKEND (api/chat.js), não no frontend.
 * Importa o supabase admin client com service_role para escrever insights.
 */

import { callGemini } from './providers.js';

/**
 * Gera insights da sessão e salva na tabela conversation_insights.
 * Chamado ao final de uma conversa (timeout ou usuário fecha).
 *
 * @param {Array<{role: string, content: string}>} messages - últimas mensagens da conversa
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseAdmin
 */
export async function generateSessionInsights(messages, userId, supabaseAdmin) {
  if (!messages || messages.length < 2) return; // Conversa muito curta, pular

  const convo = messages
    .slice(-8) // Só as últimas 8 mensagens para economizar tokens
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  let result;
  try {
    result = await callGemini(
      `Extraia 1-2 insights ESPECÍFICOS sobre este usuário baseado na conversa abaixo.
Responda APENAS JSON válido: {"insights":[{"insight":"texto descritivo","category":"preference|difficulty|progress|restriction|context"}]}
"preference" = preferências alimentares. "difficulty" = dificuldades/desafios. "progress" = progressos relatados. "restriction" = restrições/alergias. "context" = contexto de vida relevante.
Exemplos BONS: "Prefere frango grelhado a carne vermelha", "Tem dificuldade de comer bem aos finais de semana".
Exemplos RUINS: "Come proteína", "Quer emagrecer" (genérico demais).

Conversa:
${convo}`,
      'gemini-2.0-flash-lite',
      200
    );
  } catch (err) {
    console.warn('[Memory] Falha ao gerar insights:', err.message);
    return;
  }

  try {
    const clean = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.insights)) return;

    for (const insight of parsed.insights) {
      if (!insight.insight || !insight.category) continue;
      await supabaseAdmin
        .from('conversation_insights')
        .insert({ user_id: userId, insight: insight.insight, category: insight.category });
    }
  } catch (err) {
    console.warn('[Memory] Falha ao salvar insights:', err.message);
  }
}

/**
 * Recupera os insights mais recentes para injetar no system prompt.
 *
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {number} limit
 * @returns {Promise<Array<{insight: string, category: string}>>}
 */
export async function getRecentInsights(userId, supabase, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('conversation_insights')
      .select('insight, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[Memory] Falha ao buscar insights:', err.message);
    return [];
  }
}
