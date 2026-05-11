const GROQ_API_KEY    = process.env.GROQ_API_KEY;
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY;
const SUPABASE_URL    = process.env.SUPABASE_URL || "https://ymmehralehwgfmracvyr.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'https://praxis-gold.vercel.app',
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests = 10, windowMs = 60_000) {
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

function getUserIdFromToken(authHeader) {
  try {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || null;
  } catch { return null; }
}

async function validateToken(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  return res.ok;
}

// ── SANITIZE ──────────────────────────────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E\u00C0-\u017E\u0080-\u00BF]/g, '')
    .slice(0, 200);
}

// ── PROMPT ────────────────────────────────────────────────────────────────────
function buildPrompt(restaurantName, dishName) {
  return `Você é um especialista em nutrição. Estime os valores nutricionais do prato "${dishName}" do restaurante "${restaurantName}" (ou tipo similar de estabelecimento).

Retorne APENAS um JSON válido (sem markdown, sem código fence) com exatamente esta estrutura:
{
  "food_name": "nome descritivo do prato em português",
  "calories": 550,
  "protein": 25.0,
  "carbs": 45.0,
  "fat": 29.0,
  "fiber": 3.0,
  "sugar": 9.0,
  "sodium": 940,
  "confidence": "media",
  "benefits": "principal benefício nutricional em uma frase",
  "watch_out": "ponto de atenção em uma frase",
  "ai_tip": "dica personalizada de consumo em uma frase",
  "verdict": "avaliação geral em uma frase",
  "next_action": "sugestão de próxima refeição em uma frase"
}

Regras:
- confidence deve ser "alta" (restaurante bem conhecido), "media" (estimativa razoável) ou "baixa" (restaurante desconhecido)
- Porção padrão de uma unidade/prato individual
- Valores numéricos sem unidade no JSON
- NÃO inclua texto fora do JSON`;
}

// ── LLM PROVIDERS ─────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
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
  return data.choices[0].message.content;
}

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${err.error?.message ?? "erro desconhecido"}`);
  }
  const data = await res.json();
  if (!data.candidates?.length) throw new Error("Gemini retornou resposta vazia");
  return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
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
    const rateLimitKey = userId || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(rateLimitKey, 10, 60_000)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Tente novamente em 1 minuto.' });
    }

    const { restaurantName, dishName } = req.body ?? {};

    if (!restaurantName || typeof restaurantName !== 'string' || !restaurantName.trim()) {
      return res.status(400).json({ error: "restaurantName é obrigatório" });
    }
    if (!dishName || typeof dishName !== 'string' || !dishName.trim()) {
      return res.status(400).json({ error: "dishName é obrigatório" });
    }

    const prompt = buildPrompt(sanitize(restaurantName), sanitize(dishName));
    const errors = [];
    let rawText = null;

    if (GROQ_API_KEY) {
      try {
        rawText = await callGroq(prompt);
      } catch (err) {
        console.warn("Groq falhou, tentando Gemini:", err.message);
        errors.push(`Groq: ${err.message}`);
      }
    }

    if (!rawText && GEMINI_API_KEY) {
      try {
        rawText = await callGemini(prompt);
      } catch (err) {
        errors.push(`Gemini: ${err.message}`);
        console.error("Todos os provedores falharam:", errors);
        return res.status(502).json({ error: "Todos os provedores de IA falharam", details: errors });
      }
    }

    if (!rawText) {
      return res.status(502).json({ error: "Nenhum provedor de IA disponível", details: errors });
    }

    const cleaned = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: "Resposta do LLM não é JSON válido" });
    }

    const validConf = ["alta", "media", "baixa"];
    if (!validConf.includes(parsed.confidence)) parsed.confidence = "media";

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("restaurant handler error:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
