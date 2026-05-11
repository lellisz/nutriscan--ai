// supabase/functions/voice-transcribe/index.ts
// Voice → Transcript → Parsed Meal
// Pipeline: base64 audio → Groq Whisper → Groq llama-3.3-70b (extract structured)
// Auth: JWT obrigatório.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getUserFromAuthHeader } from '../_shared/auth.ts';
import { callGroq, transcribeAudioGroq, extractJson } from '../_shared/groq.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  estimated_kcal: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
}

interface ParsedMeal {
  items: ParsedItem[];
  confidence: number;
}

const EXTRACT_SYSTEM = `Você é um extrator nutricional. Receberá um transcript de voz em português descrevendo o que a pessoa comeu/bebeu. Extraia ingredientes e quantidades.

Responda EXCLUSIVAMENTE em JSON válido, sem markdown, no formato:
{"items":[{"name":"string","quantity":number,"unit":"string","estimated_kcal":number,"estimated_protein":number,"estimated_carbs":number,"estimated_fat":number}],"confidence":0.0_a_1.0}

Regras:
- "name" em português, lowercase, descritivo (ex.: "arroz branco cozido", "peito de frango grelhado")
- "unit" em pt-BR: "g", "ml", "unidade", "colher", "fatia", "xícara"
- Macros estimados por porção total declarada (não por 100g)
- "confidence" reflete clareza do transcript: 0.9+ se ingredientes e quantidades estão claros; 0.5-0.7 se quantidades aproximadas; <0.5 se transcript ambíguo
- Se transcript não descrever comida, retorne items: [] e confidence: 0`;

function decodeBase64ToBytes(b64: string): Uint8Array {
  // Remove data URI prefix se presente
  const clean = b64.replace(/^data:[^;]+;base64,/, '').trim();
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // 1. AUTH
  let auth;
  try {
    auth = await getUserFromAuthHeader(req, corsHeaders);
  } catch (resp) {
    return resp instanceof Response ? resp : jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { user_id } = auth;

  try {
    // 2. PARSE BODY
    let body: { audioBase64?: string; mimeType?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { audioBase64, mimeType } = body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return jsonResponse({ error: 'audioBase64 (string) is required' }, 400);
    }
    const mt = (mimeType ?? 'audio/m4a').toString();

    // 3. DECODE BASE64
    let audioBytes: Uint8Array;
    try {
      audioBytes = decodeBase64ToBytes(audioBase64);
    } catch {
      return jsonResponse({ error: 'Invalid base64 audio data' }, 400);
    }

    // Limite defensivo: 25 MB (Groq Whisper max ~25MB)
    if (audioBytes.length === 0) {
      return jsonResponse({ error: 'Empty audio buffer' }, 400);
    }
    if (audioBytes.length > 25 * 1024 * 1024) {
      return jsonResponse({ error: 'Audio too large (max 25MB)' }, 413);
    }

    // 4. WHISPER TRANSCRIBE
    let transcript: string;
    try {
      transcript = await transcribeAudioGroq(audioBytes, mt, 'pt');
    } catch (err) {
      console.error(`[voice-transcribe] whisper failed user=${user_id}:`, (err as Error).message);
      return jsonResponse({ error: 'Transcription failed' }, 502);
    }

    if (!transcript) {
      return jsonResponse(
        { transcript: '', parsed: { items: [], confidence: 0 } satisfies ParsedMeal },
        200
      );
    }

    // 5. EXTRACT STRUCTURED MEAL
    let parsed: ParsedMeal = { items: [], confidence: 0 };
    try {
      const raw = await callGroq(
        [
          { role: 'system', content: EXTRACT_SYSTEM },
          { role: 'user', content: `Transcript: ${transcript}` },
        ],
        {
          model: 'llama-3.3-70b-versatile',
          max_tokens: 600,
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }
      );
      const obj = extractJson<ParsedMeal>(raw);
      if (obj && Array.isArray(obj.items)) {
        parsed = {
          items: obj.items.map((it) => ({
            name: String(it.name ?? '').slice(0, 80),
            quantity: Number(it.quantity ?? 0),
            unit: String(it.unit ?? 'g').slice(0, 16),
            estimated_kcal: Math.max(0, Number(it.estimated_kcal ?? 0)),
            estimated_protein: Math.max(0, Number(it.estimated_protein ?? 0)),
            estimated_carbs: Math.max(0, Number(it.estimated_carbs ?? 0)),
            estimated_fat: Math.max(0, Number(it.estimated_fat ?? 0)),
          })),
          confidence: Math.min(1, Math.max(0, Number(obj.confidence ?? 0))),
        };
      }
    } catch (err) {
      console.warn(`[voice-transcribe] extract failed user=${user_id}:`, (err as Error).message);
      // não falhar a request: devolver transcript com parsed vazio
    }

    return jsonResponse({ transcript, parsed }, 200);
  } catch (err) {
    console.error('[voice-transcribe] error:', (err as Error).message);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
