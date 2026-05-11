const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ymmehralehwgfmracvyr.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const MAX_MESSAGES = 50;

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

function checkRateLimit(key, maxRequests = 20, windowMs = 60_000) {
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

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
/**
 * Sanitiza uma string para uso seguro dentro do system prompt,
 * removendo sequências que poderiam ser interpretadas como novas instruções.
 */
function sanitizeForPrompt(str) {
  if (typeof str !== 'string') return '';
  // Remove quebras de linha e sequências de controle que permitem injeção de prompt
  return str.replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E\u00C0-\u017E\u0080-\u00BF]/g, '').slice(0, 200);
}

function buildSystemPrompt(context) {
  let prompt = `Você é o Coach Nutri, um assistente de nutrição especializado e empático do app Praxis.
Responda em português brasileiro, de forma clara, objetiva e motivadora.
Foque em nutrição, saúde e bem-estar. Evite conselhos médicos.
Seja conciso: máximo 3 parágrafos por resposta.`;

  if (context?.totals) {
    const t = context.totals;
    // Aceita apenas números — evita injeção via campos numéricos
    const cal = Number(t.calories) || 0;
    const prot = Number(t.protein) || 0;
    const carbs = Number(t.carbs) || 0;
    const fat = Number(t.fat) || 0;
    const fiber = Number(t.fiber) || 0;
    prompt += `\n\nConsumo de hoje do usuário: ${cal} kcal | Proteína: ${prot}g | Carbs: ${carbs}g | Gordura: ${fat}g | Fibra: ${fiber}g.`;
  }

  if (context?.goals) {
    const g = context.goals;
    const cal = Number(g.calories) || 0;
    const prot = Number(g.protein) || 0;
    const carbs = Number(g.carbs) || 0;
    const fat = Number(g.fat) || 0;
    prompt += `\nMetas diárias: ${cal} kcal | Proteína: ${prot}g | Carbs: ${carbs}g | Gordura: ${fat}g.`;
  }

  if (Array.isArray(context?.mealNames) && context.mealNames.length) {
    // Sanitiza cada nome de refeição individualmente
    const safeMealNames = context.mealNames
      .slice(0, 20) // limita a 20 itens
      .map(sanitizeForPrompt)
      .filter(Boolean);
    if (safeMealNames.length) {
      prompt += `\nRefeições registradas hoje: ${safeMealNames.join(", ")}.`;
    }
  }

  return prompt;
}

async function callGroq(messages, systemPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${err.error?.message ?? "erro desconhecido"}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(messages, systemPrompt) {
  const history = messages
    .map((m) => `${m.role === "user" ? "Usuário" : "Coach"}: ${m.content}`)
    .join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nConversa:\n${history}\nCoach:` }],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${err.error?.message ?? "erro desconhecido"}`);
  }

  const data = await res.json();

  if (!data.candidates?.length) {
    throw new Error("Gemini retornou resposta vazia (sem candidates)");
  }

  return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOllama(messages, systemPrompt) {
  // Nota: OLLAMA_BASE_URL deve ser um serviço externo acessível em produção.
  // localhost:11434 só funciona em desenvolvimento local.
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return data.message?.content ?? "";
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

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Token necessário" });

    const valid = await validateToken(token);
    if (!valid) return res.status(401).json({ error: "Token inválido ou expirado" });

    // Rate limiting: 20 req/min por userId
    const userId = getUserIdFromToken(req.headers.authorization);
    const rateLimitKey = userId || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(rateLimitKey, 20, 60_000)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Tente novamente em 1 minuto.' });
    }

    const { messages, context } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages é obrigatório e deve ser um array" });
    }

    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: `messages não pode ter mais de ${MAX_MESSAGES} itens` });
    }

    // Valida cada item: role deve ser 'user' ou 'assistant', content deve ser string
    const validRoles = new Set(['user', 'assistant']);
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') {
        return res.status(400).json({ error: "Cada item de messages deve ser um objeto" });
      }
      if (!validRoles.has(msg.role)) {
        return res.status(400).json({ error: "role deve ser 'user' ou 'assistant'" });
      }
      if (typeof msg.content !== 'string' || msg.content.trim() === '') {
        return res.status(400).json({ error: "content deve ser uma string não vazia" });
      }
    }

    const systemPrompt = buildSystemPrompt(context);
    const errors = [];

    // Estratégia: Groq → Gemini → Ollama
    if (GROQ_API_KEY) {
      try {
        const reply = await callGroq(messages, systemPrompt);
        return res.status(200).json({ message: reply });
      } catch (err) {
        console.warn("Groq falhou, tentando Gemini:", err.message);
        errors.push(`Groq: ${err.message}`);
      }
    } else {
      console.warn("GROQ_API_KEY não configurada, pulando para Gemini");
    }

    if (GEMINI_API_KEY) {
      try {
        const reply = await callGemini(messages, systemPrompt);
        return res.status(200).json({ message: reply });
      } catch (err) {
        console.warn("Gemini falhou, tentando Ollama:", err.message);
        errors.push(`Gemini: ${err.message}`);
      }
    } else {
      console.warn("GEMINI_API_KEY não configurada, pulando para Ollama");
    }

    try {
      const reply = await callOllama(messages, systemPrompt);
      return res.status(200).json({ message: reply });
    } catch (err) {
      errors.push(`Ollama: ${err.message}`);
      console.error("Todos os provedores falharam:", errors);
      return res.status(502).json({ error: "Todos os provedores de IA falharam", details: errors });
    }
  } catch (err) {
    console.error("chat handler error:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
