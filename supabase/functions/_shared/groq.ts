// supabase/functions/_shared/groq.ts
// Helper compartilhado para chamadas Groq (chat + whisper)

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';
const GROQ_BASE = 'https://api.groq.com/openai/v1';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  response_format?: { type: 'json_object' | 'text' };
}

/**
 * Chamada genérica ao Groq Chat Completions.
 * Throws se GROQ_API_KEY ausente ou API retornar erro.
 */
export async function callGroq(
  messages: GroqMessage[],
  options: GroqOptions = {}
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY missing in edge function env');
  }

  const body: Record<string, unknown> = {
    model: options.model ?? 'llama-3.3-70b-versatile',
    max_tokens: options.max_tokens ?? 600,
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
    messages,
  };
  if (options.response_format) {
    body.response_format = options.response_format;
  }

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq chat ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Tenta extrair JSON da resposta do Groq, lidando com cercas markdown.
 */
export function extractJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  let s = raw.trim();
  // remove ```json ... ```
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // pega primeiro { ... } balanceado se houver lixo antes/depois
  const start = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (start !== -1 && last !== -1 && last > start) {
    s = s.slice(start, last + 1);
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * Transcreve áudio via Groq Whisper (whisper-large-v3-turbo).
 * audioBuffer: Uint8Array do arquivo (m4a, mp3, wav, webm, etc).
 * Retorna a string do transcript (response_format=json -> data.text).
 */
export async function transcribeAudioGroq(
  audioBuffer: Uint8Array,
  mimeType: string,
  language = 'pt'
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY missing in edge function env');
  }

  // Determinar extensão a partir do mimeType (Whisper exige nome de arquivo coerente)
  const ext = mimeTypeToExt(mimeType);
  const filename = `audio.${ext}`;

  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType }), filename);
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  form.append('language', language);

  const response = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq whisper ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  return (data.text ?? '').trim();
}

function mimeTypeToExt(mt: string): string {
  const m = (mt ?? '').toLowerCase();
  if (m.includes('m4a') || m.includes('mp4a') || m.includes('aac')) return 'm4a';
  if (m.includes('mp3') || m.includes('mpeg')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  if (m.includes('webm')) return 'webm';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('flac')) return 'flac';
  if (m.includes('mp4')) return 'mp4';
  return 'm4a';
}
