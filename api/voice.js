/**
 * Praxis Nutri — /api/voice
 * Parseia texto de voz em alimentos estruturados usando Groq LLaMA 70B.
 * Recebe: { text: string, userId: string }
 * Retorna: { foods: [{ name, quantity_g, kcal, protein_g, carb_g, fat_g }] }
 */

import { createClient } from "@supabase/supabase-js";

// ── Rate Limiter simples ──────────────────────────────────
const requestMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 15;
  const times = (requestMap.get(userId) || []).filter((t) => now - t < windowMs);
  if (times.length >= max) return false;
  requestMap.set(userId, [...times, now]);
  return true;
}

// ── Auth JWT ──────────────────────────────────────────────
async function validateAuth(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Não autorizado"), { status: 401 });
  }
  const token = authHeader.slice(7);
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw Object.assign(new Error("Não autorizado"), { status: 401 });
  return data.user.id;
}

// ── Groq call ─────────────────────────────────────────────
async function parseVoiceWithGroq(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY não configurada");

  const systemPrompt = `Você é um especialista em nutrição brasileira. Extraia alimentos de frases em português.
Conheça: PF (~700kcal), coxinha (~300kcal), açaí médio (~400kcal), tapioca (~150kcal), pão de queijo (~150kcal).
Use estimativas realistas para porções brasileiras típicas.
RESPONDA APENAS COM JSON VÁLIDO, sem texto adicional:
{"foods":[{"name":"nome do alimento","quantity_g":100,"kcal":200,"protein_g":10,"carb_g":25,"fat_g":5}]}
Se não conseguir identificar alimentos, retorne: {"foods":[]}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extraia os alimentos desta frase: "${text}"` },
      ],
      temperature: 0.1,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";

  // Extrair JSON da resposta (pode ter texto em volta)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { foods: [] };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { foods: [] };
  }
}

// ── Handler principal ─────────────────────────────────────
export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const userId = await validateAuth(req);

    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: "Muitas requisições. Aguarde um momento." });
    }

    const { text } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return res.status(400).json({ error: "Texto inválido ou muito curto" });
    }

    const result = await parseVoiceWithGroq(text.trim().slice(0, 500));
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    console.error("[VOICE]", err.message);
    return res.status(status).json({ error: err.message || "Erro interno" });
  }
}
