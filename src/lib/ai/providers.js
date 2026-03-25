/**
 * Praxis Nutri — AI Providers
 * Groq (LLaMA) + Gemini (Flash) — NÃO usar Anthropic/Claude no chatbot
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Chama a API Groq (compatível com formato OpenAI).
 * @param {Array<{role: string, content: string|object[]}>} messages
 * @param {string} model
 * @param {number} maxTokens
 * @param {number} temperature
 * @returns {Promise<string>}
 */
export async function callGroq(
  messages,
  model = 'llama-3.3-70b-versatile',
  maxTokens = 800,
  temperature = 0.7
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Chama a API Gemini (texto).
 * @param {string} prompt
 * @param {string} model
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
export async function callGemini(
  prompt,
  model = 'gemini-2.0-flash',
  maxTokens = 800
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Chama Gemini Vision para análise de imagem (scan de alimentos).
 * @param {string} imageBase64
 * @param {string} mimeType
 * @param {string} prompt
 * @param {string} model
 * @returns {Promise<string>}
 */
export async function callGeminiVision(
  imageBase64,
  mimeType,
  prompt,
  model = 'gemini-2.5-flash'
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini Vision ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
