// supabase/functions/_shared/gemini.ts
// Helper compartilhado para Google Gemini (texto / vision).
// Retorna null se GEMINI_API_KEY não estiver configurado (fallback gracioso).

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiOptions {
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

/**
 * Verdadeiro se a key está disponível.
 */
export function isGeminiAvailable(): boolean {
  return GEMINI_API_KEY.length > 0;
}

/**
 * Chamada simples ao Gemini com prompt único.
 * Retorna null se GEMINI_API_KEY ausente OU se a chamada falhar.
 * Caller pode usar para fallback heurístico.
 */
export async function callGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const model = options.model ?? 'gemini-2.5-flash-exp';
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options.maxOutputTokens ?? 256,
          temperature: options.temperature ?? 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Gemini ${response.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text.trim() || null;
  } catch (err) {
    console.warn('Gemini call failed:', (err as Error).message);
    return null;
  }
}
