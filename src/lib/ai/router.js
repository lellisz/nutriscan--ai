/**
 * Praxis Nutri — Intent Router
 * Classifica a intenção do usuário com LLaMA 8B (rápido, grátis)
 * e roteia para o provider/modelo correto.
 */

import { callGroq } from './providers.js';

/**
 * @typedef {'question'|'emotional'|'food_log'|'recipe_request'|'progress_report'|'goal_update'|'small_talk'} UserIntent
 */

const VALID_INTENTS = [
  'question',
  'emotional',
  'food_log',
  'recipe_request',
  'progress_report',
  'goal_update',
  'small_talk',
];

/**
 * Classifica a intenção do usuário usando LLaMA 8B (~10ms, grátis).
 * @param {string} message
 * @returns {Promise<UserIntent>}
 */
export async function detectIntent(message) {
  try {
    const result = await callGroq(
      [{
        role: 'user',
        content: `Classifique em UMA categoria:
question | emotional | food_log | recipe_request | progress_report | goal_update | small_talk

Responda APENAS a categoria, sem mais nada.
Mensagem: "${message.slice(0, 200)}"`,
      }],
      'llama-3.1-8b-instant',
      10,
      0.05
    );

    const intent = result.trim().toLowerCase().replace(/[^a-z_]/g, '');
    return VALID_INTENTS.includes(intent) ? intent : 'question';
  } catch {
    // Fallback se classificação falhar: tratar como pergunta genérica
    return 'question';
  }
}

/**
 * Seleciona o provider e modelo ideal para cada intent.
 * @param {UserIntent} intent
 * @returns {{ provider: 'groq'|'gemini', model: string, maxTokens: number }}
 */
export function selectProvider(intent) {
  const routes = {
    question:        { provider: 'groq',   model: 'llama-3.3-70b-versatile', maxTokens: 800 },
    emotional:       { provider: 'groq',   model: 'llama-3.3-70b-versatile', maxTokens: 600 },
    recipe_request:  { provider: 'groq',   model: 'llama-3.3-70b-versatile', maxTokens: 1000 },
    food_log:        { provider: 'gemini', model: 'gemini-2.0-flash',        maxTokens: 300 },
    progress_report: { provider: 'gemini', model: 'gemini-2.0-flash',        maxTokens: 500 },
    goal_update:     { provider: 'gemini', model: 'gemini-2.0-flash',        maxTokens: 400 },
    small_talk:      { provider: 'gemini', model: 'gemini-2.0-flash',        maxTokens: 200 },
  };

  return routes[intent] ?? routes.question;
}
