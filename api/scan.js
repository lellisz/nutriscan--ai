import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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
  check(userId) {
    if (!userId) {
      // Allow requests without userId (shouldn't happen in normal flow)
      return { allowed: true, retryAfter: 0 };
    }

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
  imageBase64: z.string().min(1, "imageBase64 is required").max(20 * 1024 * 1024, "Image too large (max 20MB base64)"),
  mediaType: z.string().refine(
    (val) => val.startsWith("image/"),
    "mediaType must be a valid image MIME type"
  ),
  userId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
});

/**
 * Schema de validação para resposta de scan
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
});

const SYSTEM_PROMPT = `Voce e um nutricionista especialista e analisa alimentos por imagem com extrema precisao. Retorne APENAS JSON valido, sem markdown: { "food_name": "Nome do alimento em portugues", "emoji": "emoji tematico", "category": "proteina"|"carboidrato"|"gordura"|"fruta"|"vegetal"|"bebida"|"misto", "portion": "Porcao estimada ex: 1 prato medio ~350g", "calories": numero, "protein": numero, "carbs": numero, "fat": numero, "fiber": numero, "sugar": numero, "sodium": numero, "glycemic_index": "baixo"|"medio"|"alto", "satiety_score": 1-10, "cutting_score": 1-10, "confidence": "alta"|"media"|"baixa", "benefits": ["max 2 beneficios curtos"], "watch_out": "aviso curto ou null", "ai_tip": "dica pratica de 1 frase para quem quer emagrecer" }`;

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
          model: "claude-sonnet-4-20250514",
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
      return data;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

function cleanJsonPayload(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

/**
 * Verifica se usuário tem direito de fazer scan (premium ou scans grátis disponíveis)
 */
async function checkScanPermission(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_premium, free_scans_used, free_scans_limit")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to check profile: ${error.message}`);
  }

  if (!profile) {
    throw new Error("Profile not found");
  }

  // Premium users can scan unlimited
  if (profile.is_premium) {
    return { allowed: true, remaining: null };
  }

  // Free users have limited scans
  const remaining = profile.free_scans_limit - profile.free_scans_used;
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      error: `You've used all ${profile.free_scans_limit} free scans. Please upgrade to premium.`,
    };
  }

  return { allowed: true, remaining };
}

/**
 * Incrementa contador de scans gratuitos apóssucesso
 */
async function incrementFreeScanCount(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, free_scans_used")
    .eq("user_id", userId)
    .single();

  // Só incrementa se não for premium
  if (!profile?.is_premium) {
    await supabase
      .from("profiles")
      .update({ free_scans_used: (profile?.free_scans_used || 0) + 1 })
      .eq("user_id", userId);
  }
}
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

  if (req.method !== "POST") {
    console.warn(`[${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validação inicial do ambiente
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error(`[${requestId}] ANTHROPIC_API_KEY not configured`);
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // Validação de request com Zod
  let validatedRequest;
  try {
    validatedRequest = ScanRequestSchema.parse(req.body ?? {});
    console.log(`[${requestId}] Request validation passed`);
  } catch (validationError) {
    console.warn(`[${requestId}] Request validation failed:`, validationError.errors);
    return res.status(400).json({
      error: "Invalid request",
      details: validationError.errors.map((e) => e.message),
    });
  }

  const { imageBase64, mediaType, userId, imageUrl = null } = validatedRequest;

  // Check scan permission (premium or free scans remaining)
  if (userId) {
    const supabase = getAdminSupabase();
    try {
      const permissionCheck = await checkScanPermission(supabase, userId);
      if (!permissionCheck.allowed) {
        console.warn(`[${requestId}] User ${userId} has no remaining free scans`);
        return res.status(402).json({
          error: permissionCheck.error,
          upgrade: true,
        });
      }
      if (permissionCheck.remaining !== null) {
        console.log(`[${requestId}] User ${userId} has ${permissionCheck.remaining} free scans remaining`);
      }
    } catch (permissionError) {
      console.error(`[${requestId}] Permission check failed:`, permissionError.message);
      return res.status(500).json({ error: "Failed to check scan permission" });
    }
  }

  try {
  const rateLimitCheck = rateLimiter.check(userId);
  if (!rateLimitCheck.allowed && userId) {
    console.warn(`[${requestId}] Rate limit exceeded for user ${userId}`);
    res.setHeader("Retry-After", String(rateLimitCheck.retryAfter));
    
    // Track rate limit hit in analytics (if available)
    try {
      // Store rate limit hit for later analytics tracking
      const supabase = getAdminSupabase();
      if (supabase && userId) {
        await supabase.from("rate_limit_hits").insert({
          user_id: userId,
          request_id: requestId,
          timestamp: new Date().toISOString(),
        }).catch(() => {
          // Ignore DB errors, don't block the response
        });
      }
    } catch (err) {
      console.error(`[${requestId}] Failed to log rate limit hit:`, err.message);
    }

    return res.status(429).json({
      error: `Too many requests. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
      retryAfter: rateLimitCheck.retryAfter,
    });
  }

  try {
    // Chama Anthropic com retry
    console.log(`[${requestId}] Calling Anthropic API...`);
    const response = await callAnthropicWithRetry(imageBase64, mediaType);

    // Extrai texto da resposta
    const text =
      response.content?.find((block) => block.type === "text")?.text ?? "";
    if (!text) {
      console.error(`[${requestId}] Empty response from Anthropic`);
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

    // Validação de resposta com Zod
    try {
      parsed = ScanResponseSchema.parse(parsed);
      console.log(`[${requestId}] Response validation passed`);
    } catch (validationError) {
      console.error(`[${requestId}] Response validation failed:`, validationError.errors);
      return res.status(502).json({
        error: "Invalid AI response format",
        details: validationError.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }

    // Salva no banco (ignora erros de banco, retorna sucesso mesmo assim)
    let savedScan = null;
    try {
      savedScan = await saveScanToDatabase(requestId, {
        userId,
        imageUrl,
        analysis: parsed,
      });

      // Increment free scan count after successful scan
      if (userId) {
        const supabase = getAdminSupabase();
        await incrementFreeScanCount(supabase, userId);
      }
    } catch (databaseError) {
      console.error(`[${requestId}] Database save error (non-fatal):`, databaseError.message);
      // Não falha a requisição, retorna sucesso mesmo assim
    }

    console.log(`[${requestId}] Request completed successfully`);
    return res.status(200).json({
      result: parsed,
      savedScan,
    });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error.message);
    return res.status(500).json({
      error: "Failed to analyze food",
    });
  }
}
