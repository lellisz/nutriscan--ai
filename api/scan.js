const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ymmehralehwgfmracvyr.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const MAX_IMAGE_SIZE = 5_000_000; // ~5MB base64

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
const rateLimitMap = new Map(); // key: userId|ip -> { count, resetAt }

function checkRateLimit(key, maxRequests = 10, windowMs = 60_000) {
  const now = Date.now();

  // Limpa entradas expiradas para evitar memory leak em produção
  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) rateLimitMap.delete(k);
  }

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // permitido
  }
  if (entry.count >= maxRequests) return false; // bloqueado
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

// ── SCAN PROMPT ───────────────────────────────────────────────────────────────
const SCAN_PROMPT = `Analise esta imagem de alimento e retorne APENAS um JSON válido (sem markdown, sem código fence) com exatamente esta estrutura:

{
  "food_name": "nome do alimento em português",
  "calories": 350,
  "protein": 12.5,
  "carbs": 45.0,
  "fat": 8.0,
  "fiber": 3.0,
  "sugar": 5.0,
  "sodium": 300,
  "confidence": "alta",
  "benefits": "Principais benefícios nutricionais em uma frase",
  "watch_out": "O que observar ou ponto de atenção em uma frase",
  "ai_tip": "Dica personalizada de consumo em uma frase",
  "verdict": "Avaliação geral: ex: Refeição balanceada",
  "next_action": "Sugestão de próxima ação alimentar em uma frase"
}

Regras:
- "confidence" deve ser exatamente "alta", "media" ou "baixa"
- Valores numéricos em gramas (sem unidade no JSON)
- Se não conseguir identificar, retorne o que conseguiu com confidence "baixa"
- NÃO inclua markdown ou texto extra fora do JSON`;

async function validateToken(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  return res.ok;
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Token necessário" });

  const valid = await validateToken(token);
  if (!valid) return res.status(401).json({ error: "Token inválido ou expirado" });

  // Rate limiting: 10 req/min por userId
  const userId = getUserIdFromToken(req.headers.authorization);
  const rateLimitKey = userId || req.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(rateLimitKey, 10, 60_000)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Tente novamente em 1 minuto.' });
  }

  const { imageBase64, mediaType = "image/jpeg" } = req.body ?? {};
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 é obrigatório" });

  if (imageBase64.length > MAX_IMAGE_SIZE) {
    return res.status(413).json({ error: "Imagem muito grande (máx 5MB em base64)" });
  }

  if (!GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY não configurada" });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType, data: imageBase64 } },
                { text: SCAN_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error("Gemini error:", err);
      return res.status(502).json({ error: err.error?.message ?? `Gemini retornou ${geminiRes.status}` });
    }

    const geminiData = await geminiRes.json();

    if (!geminiData.candidates?.length) {
      return res.status(502).json({ error: "Gemini retornou resposta vazia (sem candidates)" });
    }

    const rawText = geminiData.candidates[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) {
      return res.status(502).json({ error: "Gemini retornou texto vazio" });
    }

    // Remove possíveis code fences caso o modelo ignore as instruções
    const cleaned = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Parse error, raw:", rawText);
      // Não expõe rawText ao cliente — pode conter conteúdo sensível do modelo
      return res.status(502).json({ error: "Resposta do Gemini não é JSON válido" });
    }

    // Normaliza confidence para valores aceitos
    const validConf = ["alta", "media", "baixa"];
    if (!validConf.includes(parsed.confidence)) parsed.confidence = "media";

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("scan handler error:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
