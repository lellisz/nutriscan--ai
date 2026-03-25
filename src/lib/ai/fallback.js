/**
 * Praxis Nutri — Fallback Handler
 * Tenta o provider principal; se falhar, usa o outro automaticamente.
 * Groq falha → Gemini assume. Gemini falha → Groq assume.
 * Ambos falham → mensagem amigável.
 */

import { callGroq, callGemini } from './providers.js';

/**
 * Chama o provider com fallback automático.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {'groq'|'gemini'} provider - provider preferencial
 * @param {string} model - modelo preferencial
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
export async function callWithFallback(messages, provider, model, maxTokens) {
  // Converte mensagens para prompt de texto (usado pelo Gemini)
  const textPrompt = messages
    .map(m => `${m.role === 'user' ? 'Usuário' : m.role === 'assistant' ? 'Praxi' : 'Sistema'}: ${m.content}`)
    .join('\n');

  // Tentativa 1: provider preferencial
  try {
    if (provider === 'groq') {
      return await callGroq(messages, model, maxTokens);
    } else {
      return await callGemini(textPrompt, model, maxTokens);
    }
  } catch (err) {
    console.warn(`[Fallback] ${provider} falhou (${err.message}). Tentando alternativo...`);
  }

  // Tentativa 2: provider alternativo
  try {
    if (provider === 'groq') {
      // Groq falhou → Gemini Flash
      return await callGemini(textPrompt, 'gemini-2.0-flash', maxTokens);
    } else {
      // Gemini falhou → Groq 70B
      return await callGroq(messages, 'llama-3.3-70b-versatile', maxTokens);
    }
  } catch (err) {
    console.warn(`[Fallback] Provider alternativo também falhou: ${err.message}`);
  }

  // Ambos falharam → mensagem amigável
  return 'O Praxi está descansando por um momento. Por favor, tente novamente em instantes! 🥑';
}
