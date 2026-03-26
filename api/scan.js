import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ── Autenticação JWT via Supabase ──────────────────────────
// Valida o Bearer token do header Authorization e retorna o userId autenticado.
// Lanca erro com mensagem publica segura se o token for invalido ou ausente.
// Nao expoe detalhes internos do Supabase na mensagem de erro.
async function validateAuth(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw Object.assign(new Error("Token de autenticacao ausente ou invalido"), { status: 401 });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw Object.assign(new Error("Configuracao de autenticacao ausente no servidor"), { status: 500 });
  }

  // Cria cliente temporario com a chave anonima para validar o token do usuario.
  // Nao usamos service role aqui — o objetivo e apenas verificar o JWT.
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await authClient.auth.getUser();

  if (error || !data?.user) {
    // Log interno detalhado; mensagem publica generica
    console.warn("[AUTH] Token invalido:", error?.message || "sem usuario retornado");
    throw Object.assign(new Error("Nao autorizado"), { status: 401 });
  }

  return data.user.id;
}

/**
 * Simple in-memory rate limiter
 * Tracks requests per userId with 60-second sliding window
 * Limit: 5 scans per minute per user
 */
class RateLimiter {
  constructor(maxRequests = 5, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
    this.requests = new Map(); // userId -> [timestamp, timestamp, ...]
  }

  /**
   * Check if user has exceeded rate limit
   * Returns { allowed: boolean, retryAfter: seconds }
   */
  check(key) {
    if (!key) {
      // Sem identificador = rejeitar (seguranca: impede bypass do rate limiter)
      return { allowed: false, retryAfter: 60 };
    }
    const userId = key;

    const now = Date.now();
    const windowStart = now - this.windowSeconds * 1000;

    // Get existing requests for this user
    let timestamps = this.requests.get(userId) || [];

    // Remove old requests outside the window
    timestamps = timestamps.filter((t) => t > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.maxRequests) {
      // Calculate how long until the oldest request expires
      const oldestRequest = Math.min(...timestamps);
      const retryAfter = Math.ceil((oldestRequest + this.windowSeconds * 1000 - now) / 1000);
      
      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(userId, timestamps);

    return {
      allowed: true,
      retryAfter: 0,
    };
  }

  /**
   * Clean old entries to prevent memory leak (call periodically)
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowSeconds * 1000;

    for (const [userId, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter((t) => t > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }
}

const rateLimiter = new RateLimiter(5, 60); // 5 requests per 60 seconds

// Cleanup old entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Schema de validação para requisição de scan
 */
const ScanRequestSchema = z.object({
  // Limite de 7MB base64 (~5MB binario real) para prevenir DoS via payload gigante
  imageBase64: z.string().min(1, "imageBase64 is required").max(7 * 1024 * 1024, "Image too large (max 5MB)"),
  mediaType: z.enum(
    ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
    { errorMap: () => ({ message: "Tipo de imagem nao suportado. Use JPEG, PNG, WebP ou GIF." }) }
  ),
  userId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

/**
 * Schema de validação para resposta de scan
 *
 * Campos opcionais (verdict, next_action) foram adicionados para o veredicto contextual.
 * Sao opcionais para manter backward compatibility com respostas existentes no banco.
 */
const ScanResponseSchema = z.object({
  food_name: z.string(),
  emoji: z.string(),
  category: z.enum(["proteina", "carboidrato", "gordura", "fruta", "vegetal", "bebida", "misto"]),
  portion: z.string(),
  calories: z.number().int().positive(),
  protein: z.number().int().nonnegative(),
  carbs: z.number().int().nonnegative(),
  fat: z.number().int().nonnegative(),
  fiber: z.number().int().nonnegative(),
  sugar: z.number().int().nonnegative(),
  sodium: z.number().int().nonnegative(),
  glycemic_index: z.enum(["baixo", "medio", "alto"]),
  satiety_score: z.number().int().min(1).max(10),
  cutting_score: z.number().int().min(1).max(10),
  confidence: z.enum(["alta", "media", "baixa"]),
  benefits: z.array(z.string()).max(2),
  watch_out: z.string().nullable(),
  ai_tip: z.string(),
  // Veredicto contextual: avalia a refeicao no contexto do dia e do objetivo do usuario.
  // Opcional para nao quebrar respostas armazenadas antes desta versao.
  verdict: z.string().optional(),
  next_action: z.string().optional(),
});

// ── System Prompt — Praxis Nutri Scan ──────────────────────────────────────
// Diretrizes de qualidade (resumo para desenvolvedores):
//
// REFERENCIA NUTRICIONAL
// - Tabela TACO (UNICAMP) como fonte primaria para alimentos brasileiros
// - USDA FoodData Central como fonte secundaria para alimentos nao cobertos pela TACO
//
// PRECISAO E ARREDONDAMENTO
// - Calorias: arredondar para multiplos de 5 (ex: 345 -> 345, mas preferir 345 ou 350 conforme a situacao)
// - Macros (proteina, carbs, gordura, fibra, acucar): arredondar para inteiros (gramas)
// - Sodio: arredondar para inteiros (miligramas)
// - Nunca inventar valores; se nao conseguir estimar, declarar confidence "baixa"
//
// CONFIDENCE
// - "alta": alimento claramente identificavel E porcao estimavel com boa precisao
// - "media": alimento identificavel mas porcao ambigua, ou prato misto com ingredientes parcialmente visiveis
// - "baixa": imagem escura/parcial, alimento nao identificavel, porcao impossivel de estimar
//
// PORCOES
// - Sempre estimar em gramas como referencia principal
// - Se foto nao permitir estimar tamanho, assumir porcao media padrao e declarar isso no campo "portion"
// - Referencias visuais validas: tamanho de mao (~100g), prato padrao (~350g), copo americano (~240ml)
//
// VEREDICTO CONTEXTUAL (verdict + next_action)
// - "verdict": avaliacao objetiva de 1-2 frases se esta refeicao e adequada para o contexto do dia
//   Ex positivo: "Almoco equilibrado. Proteina acima da media — favoravel para ganho muscular."
//   Ex negativo: "Carboidrato elevado para esta hora sem treino previsto. Considere reduzir a porcao."
// - "next_action": recomendacao pratica e especifica para a proxima refeicao ou habito
//   Ex: "No jantar, priorize proteina magra e vegetais para fechar o balanco do dia."
//   Ex: "Beba ao menos 400ml de agua nas proximas duas horas para compensar o sodio desta refeicao."
//
// TOM
// - Sem emojis em nenhum campo de texto
// - Sem exclamacoes desnecessarias
// - Tom de nutricionista profissional, direto e baseado em evidencias
const SYSTEM_PROMPT = `Voce e um nutricionista especialista do app Praxis Nutri. Analise o alimento na imagem com precisao e honestidade.

REFERENCIAS NUTRICIONAIS:
- Use a Tabela TACO (UNICAMP) como referencia primaria para alimentos brasileiros.
- Use o USDA FoodData Central para alimentos nao cobertos pela TACO.
- Nunca invente valores. Se nao conseguir estimar com seguranca, declare confidence "baixa" e explique no campo "portion".

REGRAS DE ARREDONDAMENTO:
- Calorias: arredonde para o multiplo de 5 mais proximo.
- Macros em gramas (protein, carbs, fat, fiber, sugar): arredonde para inteiros.
- Sodio em miligramas: arredonde para inteiros.

REGRAS DE CONFIDENCE:
- "alta": alimento claramente identificavel na imagem E porcao estimavel com boa precisao visual.
- "media": alimento identificavel, mas porcao ambigua; ou prato misto com ingredientes parcialmente visiveis.
- "baixa": imagem escura, parcial ou de baixa qualidade; alimento nao identificavel; porcao impossivel de estimar.

REGRAS DE PORCAO:
- Sempre expresse a porcao em gramas como referencia principal.
- Se o tamanho nao for estimavel, assuma a porcao media padrao do alimento e declare isso.
- Use referencias visuais: tamanho de mao (~100g), prato padrao (~350g), copo americano (~240ml).

Retorne APENAS JSON valido, sem markdown, seguindo este schema exato:

{
  "food_name": "Nome descritivo em portugues (ex: Prato com arroz branco, feijao carioca e frango grelhado)",
  "emoji": "emoji tematico do alimento",
  "category": "proteina" | "carboidrato" | "gordura" | "fruta" | "vegetal" | "bebida" | "misto",
  "portion": "Porcao estimada com referencia visual em gramas (ex: 1 prato medio ~350g; ou: porcao media padrao assumida ~150g pois tamanho nao e estimavel na imagem)",
  "calories": numero inteiro positivo multiplo de 5,
  "protein": numero inteiro nao-negativo (gramas),
  "carbs": numero inteiro nao-negativo (gramas),
  "fat": numero inteiro nao-negativo (gramas),
  "fiber": numero inteiro nao-negativo (gramas),
  "sugar": numero inteiro nao-negativo (gramas),
  "sodium": numero inteiro nao-negativo (miligramas),
  "glycemic_index": "baixo" | "medio" | "alto",
  "satiety_score": numero inteiro de 1 a 10,
  "cutting_score": numero inteiro de 1 a 10,
  "confidence": "alta" | "media" | "baixa",
  "benefits": ["maximo 2 beneficios nutricionais comprovados, sem emoji, sem exagero"],
  "watch_out": "aviso nutricional objetivo e relevante, ou null se nao houver",
  "ai_tip": "dica pratica de 1 frase, tom de nutricionista profissional, sem emoji, sem exclamacao excessiva",
  "verdict": "avaliacao de 1-2 frases se esta refeicao e adequada para o contexto do dia e objetivo geral; sem emoji; objetiva e baseada nos macros",
  "next_action": "recomendacao pratica e especifica para a proxima refeicao ou habito; 1 frase direta; sem emoji"
}

REGRAS DE CONTEUDO:
1. Para pratos compostos (marmita, prato feito, etc.), some os macros de todos os componentes visiveis.
2. Se a imagem nao mostrar comida, retorne confidence "baixa", food_name "Alimento nao identificado" e macros zerados.
3. ai_tip deve ser uma observacao util, nao um elogio. Errado: "Otima escolha!". Certo: "Incluir uma fonte de gordura saudavel aumentaria a saciedade desta refeicao."
4. benefits devem ser fatos nutricionais verificaveis. Errado: "Super nutritivo". Certo: "Fonte de ferro nao-heme, com melhor absorcao quando combinado com vitamina C."
5. verdict deve mencionar o ponto mais relevante do alimento no contexto do dia (ex: proteina adequada, carboidrato elevado, sodio alto).
6. next_action deve ser concreta e acionavel, nao generica. Errado: "Continue se alimentando bem". Certo: "Priorize proteina magra no jantar para atingir a meta diaria."
7. Para alimentos tipicamente brasileiros (arroz, feijao, farofa, acai, tapioca, coxinha, pao de queijo, etc.), use obrigatoriamente os valores da Tabela TACO.`;

/**
 * Cria cliente Supabase com credenciais Admin (service role)
 * Usado apenas no backend para operações privilegiadas
 */
function getAdminSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("Supabase credentials missing");
    return null;
  }

  return createClient(url, serviceRoleKey);
}

/**
 * Chama Groq API com retry automatico
 * Modelo: llama-4-scout-17b-16e-instruct (gratuito, com suporte a imagens)
 * Tier gratuito: 14.400 req/dia, sem cartao de credito
 */
async function callGroqWithRetry(imageBase64, mediaType, maxRetries = 3) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 1000,
          temperature: 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mediaType};base64,${imageBase64}` },
                },
                { type: "text", text: "Analise o alimento na imagem." },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        // 401/403 indicam chave invalida ou sem permissao — retry nao resolve, falhar imediatamente
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Groq API error (status ${response.status}): chave invalida ou sem permissao`);
        }
        if (response.status >= 500 || response.status === 429) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }
        const errorBody = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      if (!text) throw new Error("Empty response from Groq");

      return { content: [{ type: "text", text }], provider: "groq" };
    } catch (error) {
      // Erros de autenticacao nao devem ser retentados — a mesma chave invalida falhara novamente
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('invalida') || error.message.includes('unauthorized')) {
        throw error;
      }
      if (attempt === maxRetries) throw error;
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Chama Gemini API com retry automatico e exponential backoff
 * Modelo: gemini-2.5-flash-lite (gratuito, com suporte a imagens)
 * Tier gratuito: quota generosa, sem cartao de credito
 */
async function callGeminiWithRetry(imageBase64, mediaType, maxRetries = 3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  // AVISO DE SEGURANCA: A Gemini REST API exige a chave via query string (?key=).
  // Isso significa que a chave pode aparecer em logs de proxies, CDNs e load balancers.
  // Mitigacoes aplicadas: rotacao periodica da chave, restricao de IP/referenciador
  // no Google Cloud Console, e monitoramento de uso anormal via Cloud Monitoring.
  // A Gemini API nao suporta autenticacao via header Authorization para esta rota REST.
  // Alternativa: usar a biblioteca oficial @google/generative-ai que abstrai isso.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType, data: imageBase64 } },
              { text: "Analise o alimento na imagem." },
            ],
          }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.1 },
        }),
      });

      if (!response.ok) {
        // 401/403 indicam chave invalida ou sem permissao — retry nao resolve, falhar imediatamente
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Gemini API error (status ${response.status}): chave invalida ou sem permissao`);
        }
        if (response.status >= 500 || response.status === 429) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }
        const errorBody = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) throw new Error("Empty response from Gemini");

      // Retorna no formato compatível com o parser existente
      return { content: [{ type: "text", text }], provider: "gemini" };
    } catch (error) {
      // Erros de autenticacao nao devem ser retentados — a mesma chave invalida falhara novamente
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('invalida') || error.message.includes('unauthorized')) {
        throw error;
      }
      if (attempt === maxRetries) throw error;
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Chama Anthropic API com retry automático e exponential backoff
 */
async function callAnthropicWithRetry(imageBase64, mediaType, maxRetries = 3) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: imageBase64,
                  },
                },
                {
                  type: "text",
                  text: "Analise o alimento na imagem.",
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        // 401/403 indicam chave invalida ou sem permissao — retry nao resolve, falhar imediatamente
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Anthropic API error (status ${response.status}): chave invalida ou sem permissao`);
        }
        if (response.status >= 500 || response.status === 429) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }
        const errorBody = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      // Normaliza para o formato padrão { content, provider } usado pelo parser
      // A API Anthropic já retorna content no formato correto: [{ type: "text", text: "..." }]
      return { content: data.content, provider: "anthropic" };
    } catch (error) {
      // Erros de autenticacao nao devem ser retentados — a mesma chave invalida falhara novamente
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('invalida') || error.message.includes('unauthorized')) {
        throw error;
      }
      if (attempt === maxRetries) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Chama Ollama API (llava) com retry automático e exponential backoff
 * Usado como fallback quando Anthropic falha ou como provider principal (local)
 */
async function callOllamaWithRetry(imageBase64, mediaType, maxRetries = 2) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llava";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: "Analise o alimento na imagem.",
              images: [imageBase64],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      // Ollama retorna { message: { content: "..." } }
      const text = data.message?.content ?? "";
      if (!text) {
        throw new Error("Empty response from Ollama");
      }

      // Adapta resposta para formato compatível com Anthropic
      return {
        content: [{ type: "text", text }],
        provider: "ollama",
      };
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Extrai e limpa o payload JSON da resposta do modelo.
 *
 * Estrategia em cascata:
 * 1. Tenta extrair bloco ```json ... ``` ou ``` ... ```
 * 2. Tenta encontrar o primeiro objeto JSON valido no texto (entre { e })
 * 3. Remove apenas os fences simples de cabecalho/rodape
 * 4. Retorna o texto original como fallback (deixa o JSON.parse falhar com mensagem clara)
 */
function cleanJsonPayload(text) {
  // 1. Bloco de codigo markdown com json
  const fencedJsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJsonMatch) return fencedJsonMatch[1].trim();

  // 2. Bloco de codigo markdown generico
  const fencedMatch = text.match(/```\s*([\s\S]*?)```/);
  if (fencedMatch) return fencedMatch[1].trim();

  // 3. Extrai primeiro objeto JSON valido (entre { e ultima })
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) return jsonObjectMatch[0].trim();

  // 4. Fallback: retorna texto sem espacos extras
  return text.trim();
}

/**
 * Verifica se usuário tem direito de fazer scan (premium, dev ou scans grátis disponíveis).
 * Retorna também isDev para que o caller pule o rate limiting.
 */
async function checkScanPermission(supabase, userId) {
  // maybeSingle() retorna null (sem erro) quando nenhum perfil existe,
  // evitando o PGRST116 que bloquearia usuários novos sem perfil.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_premium, free_scans_used, free_scans_limit, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check profile: ${error.message}`);
  }

  // Sem perfil = usuário ainda em onboarding; permite scan sem restrição de tier
  if (!profile) {
    return { allowed: true, remaining: null, isDev: false };
  }

  // Conta dev: bypassa paywall e não consome scans gratuitos
  if (profile.role === "dev" || profile.role === "admin") {
    return { allowed: true, remaining: null, isDev: true };
  }

  // Premium users can scan unlimited
  if (profile.is_premium) {
    return { allowed: true, remaining: null, isDev: false };
  }

  // Free users have limited scans
  const remaining = profile.free_scans_limit - profile.free_scans_used;
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      isDev: false,
      error: `Voce usou todos os ${profile.free_scans_limit} scans gratuitos. Faca upgrade para premium.`,
    };
  }

  return { allowed: true, remaining, isDev: false };
}

/**
 * Incrementa contador de scans gratuitos após sucesso.
 * Não incrementa para premium, dev ou admin.
 */
async function incrementFreeScanCount(supabase, userId) {
  // maybeSingle() evita PGRST116 para usuarios sem perfil ainda criado
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, free_scans_used, role")
    .eq("user_id", userId)
    .maybeSingle();

  // Dev e admin nunca consomem scans gratuitos
  if (profile?.role === "dev" || profile?.role === "admin") return;

  // Só incrementa se não for premium
  if (!profile?.is_premium) {
    await supabase
      .from("profiles")
      .update({ free_scans_used: (profile?.free_scans_used || 0) + 1 })
      .eq("user_id", userId);
  }
}

/**
 * Salva resultado do scan no banco de dados
 */
async function saveScanToDatabase(requestId, { userId, imageUrl, analysis }) {
  if (!userId) {
    console.log(`[${requestId}] No userId, skipping database save`);
    return null;
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    console.error(`[${requestId}] Failed to initialize Supabase client`);
    return null;
  }

  const payload = {
    request_id: requestId,
    user_id: userId,
    image_url: imageUrl ?? null,
    food_name: analysis.food_name ?? null,
    category: analysis.category ?? null,
    portion: analysis.portion ?? null,
    calories: analysis.calories ?? null,
    protein: analysis.protein ?? null,
    carbs: analysis.carbs ?? null,
    fat: analysis.fat ?? null,
    fiber: analysis.fiber ?? null,
    sugar: analysis.sugar ?? null,
    sodium: analysis.sodium ?? null,
    glycemic_index: analysis.glycemic_index ?? null,
    satiety_score: analysis.satiety_score ?? null,
    cutting_score: analysis.cutting_score ?? null,
    confidence: analysis.confidence ?? null,
    benefits: analysis.benefits ?? [],
    watch_out: analysis.watch_out ?? null,
    ai_tip: analysis.ai_tip ?? null,
    // Campos do veredicto contextual — adicionados na versao com veredicto
    verdict: analysis.verdict ?? null,
    next_action: analysis.next_action ?? null,
    raw_analysis: analysis,
  };

  const { data, error } = await supabase
    .from("scan_history")
    .insert(payload)
    .select("id, scanned_at")
    .single();

  if (error) {
    console.error(`[${requestId}] Database save failed:`, error);
    throw error;
  }

  console.log(`[${requestId}] Scan saved to database:`, data.id);
  return data;
}

/**
 * Handler principal para POST /api/scan
 */
export default async function handler(req, res) {
  // Gera request ID para tracing
  const requestId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log(`[${requestId}] Incoming request:`, req.method);

  // CORS headers — ALLOWED_ORIGIN e obrigatorio em producao.
  // Sem fallback para "*": se a variavel nao estiver definida, o servidor retorna 500
  // para evitar expor a API a qualquer origem arbitraria.
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin) {
    console.error(`[${requestId}] ALLOWED_ORIGIN nao esta configurada nas variaveis de ambiente`);
    return res.status(500).json({ error: "Configuracao do servidor incompleta" });
  }
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    console.warn(`[${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  // Validação inicial do ambiente - pelo menos um provider deve estar disponível
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const aiProvider = process.env.AI_PROVIDER || "groq_with_fallback"; // "groq", "groq_with_fallback", "gemini", "gemini_with_fallback", "anthropic", "anthropic_with_fallback", "ollama"

  if (!groqKey && !geminiKey && !anthropicKey && aiProvider !== "ollama") {
    console.error(`[${requestId}] Nenhuma chave de AI configurada. Defina GROQ_API_KEY, GEMINI_API_KEY ou ANTHROPIC_API_KEY nas env vars da Vercel.`);
    return res.status(500).json({ error: "Servico de IA nao configurado. Entre em contato com o suporte." });
  }

  // Aviso de configuração inconsistente: provider primário sem chave disponível
  if ((aiProvider === "groq" || aiProvider === "groq_with_fallback") && !groqKey) {
    console.warn(`[${requestId}] AI_PROVIDER=${aiProvider} mas GROQ_API_KEY nao esta configurada. O fallback sera acionado.`);
  }
  if ((aiProvider === "gemini" || aiProvider === "gemini_with_fallback") && !geminiKey) {
    console.warn(`[${requestId}] AI_PROVIDER=${aiProvider} mas GEMINI_API_KEY nao esta configurada. O fallback sera acionado.`);
  }
  if ((aiProvider === "anthropic" || aiProvider === "anthropic_with_fallback") && !anthropicKey) {
    console.warn(`[${requestId}] AI_PROVIDER=${aiProvider} mas ANTHROPIC_API_KEY nao esta configurada.`);
  }

  // Validação de request com Zod
  let validatedRequest;
  try {
    validatedRequest = ScanRequestSchema.parse(req.body ?? {});
    console.log(`[${requestId}] Request validation passed`);
  } catch (validationError) {
    const issues = validationError.issues || validationError.errors || [];
    console.warn(`[${requestId}] Request validation failed:`, issues);
    // Retorna mensagens de validacao de input (safe — sao regras publicas do schema de request)
    return res.status(400).json({
      error: "Dados invalidos",
      details: issues.map((e) => e.message),
    });
  }

  const { mediaType, userId, imageUrl = null } = validatedRequest;
  // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,/9j/...")
  const imageBase64 = validatedRequest.imageBase64.includes(",")
    ? validatedRequest.imageBase64.split(",")[1]
    : validatedRequest.imageBase64;

  // Validacao de JWT — OBRIGATORIA em todos os requests.
  // Rejeita requests sem Authorization ou com token de outro usuario.
  // Se userId foi enviado no body, deve corresponder ao token autenticado.
  let authenticatedUserId;
  try {
    authenticatedUserId = await validateAuth(req);
    if (userId && authenticatedUserId !== userId) {
      console.warn(`[${requestId}] userId do body (${userId}) nao corresponde ao token JWT (${authenticatedUserId})`);
      return res.status(403).json({ error: "Acesso negado" });
    }
    console.log(`[${requestId}] JWT validado para usuario ${authenticatedUserId}`);
  } catch (authError) {
    const status = authError.status || 401;
    console.warn(`[${requestId}] Falha na autenticacao:`, authError.message);
    return res.status(status).json({ error: "Nao autorizado" });
  }

  // Usa o userId do JWT como fonte de verdade (ignora userId do body se diferente)
  const effectiveUserId = authenticatedUserId;

  // Verifica permissao de scan (premium, dev ou scans gratuitos disponíveis)
  let isDevUser = false;
  {
    const supabase = getAdminSupabase();
    if (supabase) {
      try {
        const permissionCheck = await checkScanPermission(supabase, effectiveUserId);
        if (!permissionCheck.allowed) {
          console.warn(`[${requestId}] User ${effectiveUserId} has no remaining free scans`);
          return res.status(402).json({
            error: permissionCheck.error,
            upgrade: true,
          });
        }
        isDevUser = permissionCheck.isDev === true;
        if (isDevUser) {
          console.log(`[${requestId}] Dev/admin account — paywall e rate limit ignorados`);
        } else if (permissionCheck.remaining !== null) {
          console.log(`[${requestId}] User ${effectiveUserId} has ${permissionCheck.remaining} free scans remaining`);
        }
      } catch (permissionError) {
        // Log interno detalhado; mensagem publica generica
        console.error(`[${requestId}] Permission check failed:`, permissionError.message);
        return res.status(500).json({ error: "Erro ao verificar permissoes. Tente novamente." });
      }
    } else {
      console.warn(`[${requestId}] Supabase not configured, skipping permission check`);
    }
  }

  // Rate limiting — ignorado para contas dev/admin
  if (!isDevUser) {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || "unknown";
    const rateLimitKey = effectiveUserId;
    const ipRateLimitCheck = rateLimiter.check(`ip:${clientIp}`);
    const rateLimitCheck = rateLimiter.check(rateLimitKey);
    if (!ipRateLimitCheck.allowed) {
      console.warn(`[${requestId}] IP rate limit exceeded for ${clientIp}`);
      res.setHeader("Retry-After", String(ipRateLimitCheck.retryAfter));
      return res.status(429).json({
        error: `Limite de requisicoes atingido. Tente novamente em ${ipRateLimitCheck.retryAfter} segundos.`,
        retryAfter: ipRateLimitCheck.retryAfter,
      });
    }
    if (!rateLimitCheck.allowed) {
      console.warn(`[${requestId}] Rate limit exceeded for ${rateLimitKey}`);
      res.setHeader("Retry-After", String(rateLimitCheck.retryAfter));
      return res.status(429).json({
        error: `Limite de requisicoes atingido. Tente novamente em ${rateLimitCheck.retryAfter} segundos.`,
        retryAfter: rateLimitCheck.retryAfter,
      });
    }
  }

  try {
    // Chama AI com fallback baseado na configuração
    let response;
    let usedProvider;

    if (aiProvider === "ollama") {
      console.log(`[${requestId}] Calling Ollama (${process.env.OLLAMA_MODEL || "llava"})...`);
      response = await callOllamaWithRetry(imageBase64, mediaType);
      usedProvider = "ollama";
    } else if (aiProvider === "groq") {
      console.log(`[${requestId}] Calling Groq API...`);
      response = await callGroqWithRetry(imageBase64, mediaType);
      usedProvider = "groq";
    } else if (aiProvider === "groq_with_fallback") {
      // Padrao: Groq gratis primeiro, fallback para Gemini (tambem gratis)
      try {
        console.log(`[${requestId}] Calling Groq API...`);
        response = await callGroqWithRetry(imageBase64, mediaType);
        usedProvider = "groq";
      } catch (groqError) {
        console.warn(`[${requestId}] Groq failed: ${groqError.message}. Falling back to Gemini...`);
        try {
          response = await callGeminiWithRetry(imageBase64, mediaType);
          usedProvider = "gemini";
        } catch (geminiError) {
          console.warn(`[${requestId}] Gemini also failed: ${geminiError.message}. Trying Ollama as last resort...`);
          response = await callOllamaWithRetry(imageBase64, mediaType);
          usedProvider = "ollama";
        }
      }
    } else if (aiProvider === "gemini") {
      console.log(`[${requestId}] Calling Gemini API...`);
      response = await callGeminiWithRetry(imageBase64, mediaType);
      usedProvider = "gemini";
    } else if (aiProvider === "gemini_with_fallback") {
      // Gemini gratis primeiro, fallback para Groq (tambem gratis)
      try {
        console.log(`[${requestId}] Calling Gemini API...`);
        response = await callGeminiWithRetry(imageBase64, mediaType);
        usedProvider = "gemini";
      } catch (geminiError) {
        console.warn(`[${requestId}] Gemini failed: ${geminiError.message}. Falling back to Groq...`);
        try {
          response = await callGroqWithRetry(imageBase64, mediaType);
          usedProvider = "groq";
        } catch (groqError) {
          console.warn(`[${requestId}] Groq also failed: ${groqError.message}. Trying Ollama as last resort...`);
          response = await callOllamaWithRetry(imageBase64, mediaType);
          usedProvider = "ollama";
        }
      }
    } else if (aiProvider === "anthropic") {
      console.log(`[${requestId}] Calling Anthropic API (Haiku)...`);
      response = await callAnthropicWithRetry(imageBase64, mediaType);
      usedProvider = "anthropic";
    } else {
      // anthropic_with_fallback (legado): Anthropic primeiro, fallback para Ollama
      try {
        console.log(`[${requestId}] Calling Anthropic API (Haiku)...`);
        response = await callAnthropicWithRetry(imageBase64, mediaType);
        usedProvider = "anthropic";
      } catch (anthropicError) {
        console.warn(`[${requestId}] Anthropic failed: ${anthropicError.message}. Falling back to Ollama...`);
        response = await callOllamaWithRetry(imageBase64, mediaType);
        usedProvider = "ollama";
      }
    }

    // Extrai texto da resposta
    const text =
      response.content?.find((block) => block.type === "text")?.text ?? "";
    if (!text) {
      console.error(`[${requestId}] Empty response from ${usedProvider}`);
      return res.status(502).json({ error: "Empty response from AI" });
    }

    // Parse JSON com limpeza
    let parsed;
    try {
      parsed = JSON.parse(cleanJsonPayload(text));
      console.log(`[${requestId}] JSON parsed successfully`);
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse failed:`, parseError.message);
      console.error(`[${requestId}] Raw response:`, text.substring(0, 200));
      return res.status(502).json({
        error: "Invalid response format from AI",
      });
    }

    // Validacao de resposta com Zod
    try {
      parsed = ScanResponseSchema.parse(parsed);
      console.log(`[${requestId}] Response validation passed`);
    } catch (validationError) {
      const issues = validationError.issues || validationError.errors || [];
      // Log interno detalhado; mensagem publica generica (nao expor schema interno)
      console.error(`[${requestId}] Response validation failed:`, issues);
      return res.status(502).json({
        error: "Formato de resposta invalido da IA. Tente novamente.",
      });
    }

    // Salva no banco (ignora erros de banco, retorna sucesso mesmo assim)
    let savedScan = null;
    try {
      savedScan = await saveScanToDatabase(requestId, {
        userId: effectiveUserId,
        imageUrl,
        analysis: parsed,
      });

      // Increment free scan count after successful scan
      const supabase = getAdminSupabase();
      if (supabase) {
        await incrementFreeScanCount(supabase, effectiveUserId);
      }
    } catch (databaseError) {
      console.error(`[${requestId}] Database save error (non-fatal):`, databaseError.message);
      // Nao falha a requisicao, retorna sucesso mesmo assim
    }

    console.log(`[${requestId}] Request completed successfully`);
    // Nao expor nome do provider ao cliente (information disclosure)
    return res.status(200).json({
      result: parsed,
      savedScan,
    });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error.message);
    return res.status(500).json({
      error: "Falha ao analisar o alimento. Tente novamente.",
    });
  }
}
