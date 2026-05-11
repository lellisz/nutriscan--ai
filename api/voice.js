const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ymmehralehwgfmracvyr.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const MAX_AUDIO_SIZE = 25_000_000; // ~25MB base64
const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";
const GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3";

const ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "https://praxis-gold.vercel.app",
];

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests = 5, windowMs = 60_000) {
  const now = Date.now();

  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) rateLimitMap.delete(k);
  }

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

function decodeJwtPayload(token) {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) return null;

  const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  try {
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getUserIdFromToken(authHeader) {
  try {
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    return payload?.sub || null;
  } catch {
    return null;
  }
}

async function validateToken(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  return res.ok;
}

function stripDataUrlPrefix(audioBase64) {
  const match = audioBase64.match(/^data:.*?;base64,(.*)$/i);
  return match ? match[1] : audioBase64;
}

function audioFilenameForMimeType(mimeType) {
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "audio.m4a";
  if (mimeType.includes("webm")) return "audio.webm";
  if (mimeType.includes("ogg")) return "audio.ogg";
  if (mimeType.includes("wav")) return "audio.wav";
  return "audio.bin";
}

function buildVoicePrompt(transcript) {
  return `O usuário descreveu verbalmente uma refeição: "${transcript}"

Identifique o(s) alimento(s) mencionado(s) e estime os valores nutricionais da porção descrita, ou de uma porção padrão se a quantidade não tiver sido informada.

Retorne APENAS um JSON válido, sem markdown e sem code fence, com exatamente esta estrutura:
{
  "food_name": "nome descritivo da refeição em português",
  "calories": 350,
  "protein": 12.5,
  "carbs": 45.0,
  "fat": 8.0,
  "confidence": "media",
  "ai_tip": "dica personalizada de consumo em uma frase",
  "verdict": "avaliação geral em uma frase"
}

Regras:
- confidence deve ser "alta", "media" ou "baixa"
- Se houver múltiplos alimentos, trate como refeição combinada
- Valores numéricos sem unidade no JSON
- Não inclua texto fora do JSON`;
}

async function transcribeAudio(audioBase64, mimeType) {
  const base64 = stripDataUrlPrefix(audioBase64);
  const audioBuffer = Buffer.from(base64, "base64");
  const audioBlob = new Blob([audioBuffer], { type: mimeType });
  const fileName = audioFilenameForMimeType(mimeType);

  const formData = new FormData();
  formData.append("file", audioBlob, fileName);
  formData.append("model", GROQ_TRANSCRIPTION_MODEL);
  formData.append("language", "pt");
  formData.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Whisper ${res.status}: ${err.error?.message ?? "erro desconhecido"}`);
  }

  const data = await res.json();
  return typeof data.text === "string" ? data.text.trim() : "";
}

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${err.error?.message ?? "erro desconhecido"}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function stripCodeFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonText(rawText) {
  const cleaned = stripCodeFences(rawText);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function normalizeResponse(parsed) {
  const validConf = ["alta", "media", "baixa"];
  if (!validConf.includes(parsed.confidence)) parsed.confidence = "media";
  return parsed;
}

function ensureResultShape(parsed) {
  const result = normalizeResponse(parsed);

  return {
    food_name: typeof result.food_name === "string" ? result.food_name : "Refeição não identificada",
    calories: Number(result.calories) || 0,
    protein: Number(result.protein) || 0,
    carbs: Number(result.carbs) || 0,
    fat: Number(result.fat) || 0,
    confidence: result.confidence,
    ai_tip: typeof result.ai_tip === "string" ? result.ai_tip : "",
    verdict: typeof result.verdict === "string" ? result.verdict : "",
  };
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Token necessário" });

    const valid = await validateToken(token);
    if (!valid) return res.status(401).json({ error: "Token inválido ou expirado" });

    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: "Não foi possível identificar o usuário" });
    }

    if (!checkRateLimit(userId, 5, 60_000)) {
      return res.status(429).json({ error: "Rate limit exceeded. Tente novamente em 1 minuto." });
    }

    const { audioBase64, mimeType = "audio/m4a" } = req.body ?? {};

    if (typeof audioBase64 !== "string" || !audioBase64.trim()) {
      return res.status(400).json({ error: "audioBase64 é obrigatório" });
    }

    if (typeof mimeType !== "string" || !mimeType.trim()) {
      return res.status(400).json({ error: "mimeType é obrigatório" });
    }

    if (audioBase64.length > MAX_AUDIO_SIZE) {
      return res.status(413).json({ error: "Áudio muito grande (máx ~18MB em base64)" });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY não configurada" });
    }

    let transcript;
    try {
      transcript = await transcribeAudio(audioBase64, mimeType);
    } catch (err) {
      console.error("Erro na transcrição Whisper:", err.message);
      return res.status(502).json({ error: `Erro na transcrição: ${err.message}` });
    }

    if (!transcript) {
      return res.status(422).json({ error: "Não foi possível transcrever o áudio. Tente falar mais claramente." });
    }

    let rawText;
    try {
      rawText = await callGroq(buildVoicePrompt(transcript));
    } catch (err) {
      console.error("Groq falhou:", err.message);
      return res.status(502).json({ error: `Groq: ${err.message}` });
    }

    if (!rawText) {
      return res.status(502).json({ error: "Groq retornou resposta vazia" });
    }

    let parsed;
    try {
      parsed = JSON.parse(extractJsonText(rawText));
    } catch {
      console.error("Parse error, raw:", rawText);
      return res.status(502).json({ error: "Resposta do Groq não é JSON válido" });
    }

    return res.status(200).json(ensureResultShape(parsed));
  } catch (err) {
    console.error("voice handler error:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
