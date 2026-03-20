import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * ============================================================
 *  NutriScan - Coach IA Avançado
 *  Sistema inteligente de coaching nutricional com IA
 * ============================================================
 */

// ── Schemas de validação ───────────────────────────────────
const ChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  userId: z.string().uuid(),
  useCache: z.boolean().optional().default(true),
  quick: z.boolean().optional().default(false), // Resposta rápida / curta
});

// ── Configuração de Providers ──────────────────────────────
const AI_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  GROQ: 'groq',
  OLLAMA: 'ollama',
};

const MODELS = {
  ANTHROPIC_SONNET: 'claude-sonnet-4-6',
  GROQ_FAST: 'llama-3.1-8b-instant',
  GROQ_SMART: 'llama-3.3-70b-versatile',
  OLLAMA_LLAMA: 'llama3.2',
};

// ── Cache em memória (simples) ─────────────────────────────
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(userId, message) {
  return `${userId}:${message.toLowerCase().trim()}`;
}

function getCachedResponse(userId, message) {
  const key = getCacheKey(userId, message);
  const cached = responseCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[CACHE] Hit for:', message.substring(0, 50));
    return cached.response;
  }

  if (cached) {
    responseCache.delete(key); // Remove expired
  }
  return null;
}

function setCachedResponse(userId, message, response) {
  const key = getCacheKey(userId, message);
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
  });

  // Limita tamanho do cache
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}

// ── Supabase Client ────────────────────────────────────────
function getAdminSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase credentials missing");
  }

  return createClient(url, serviceRoleKey);
}

// ── Ensure Chat Tables Exist ───────────────────────────────
async function ensureChatTablesExist(supabase) {
  try {
    // Test if tables exist by querying them
    const { error: convError } = await supabase
      .from("chat_conversations")
      .select("id")
      .limit(1);
    
    const { error: msgError } = await supabase
      .from("chat_messages")
      .select("id")
      .limit(1);

    if (convError?.code === "PGRST116" || msgError?.code === "PGRST116") {
      console.error("[SETUP] Chat tables missing! Please run migration: supabase/migrations/20260317_coach_ia.sql");
      throw new Error("Chat tables not initialized. Run: supabase db push");
    }
  } catch (err) {
    if (err.message.includes("Chat tables not initialized")) throw err;
    console.warn("[SETUP] Warning checking tables:", err.message);
  }
}

// ── Contexto do Usuário Avançado ───────────────────────────
async function getUserContext(supabase, userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [profile, goals, todayScans, recentScans, weightLogs, hydration, workouts] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("daily_goals").select("*").eq("user_id", userId).maybeSingle(),

      // Scans de hoje
      supabase.from("scan_history")
        .select("food_name, calories, protein, carbs, fat, fiber, scanned_at")
        .eq("user_id", userId)
        .gte("scanned_at", `${today}T00:00:00`)
        .order("scanned_at", { ascending: false }),

      // Scans recentes (últimos 7 dias)
      supabase.from("scan_history")
        .select("food_name, calories, protein, carbs, fat, scanned_at")
        .eq("user_id", userId)
        .gte("scanned_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("scanned_at", { ascending: false })
        .limit(20),

      // Peso (últimas 10 medições)
      supabase.from("weight_logs")
        .select("weight, logged_at")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(10),

      // Hidratação de hoje
      supabase.from("hydration_logs")
        .select("glasses, logged_at")
        .eq("user_id", userId)
        .eq("logged_at", today)
        .maybeSingle(),

      // Treinos recentes
      supabase.from("workout_logs")
        .select("workout_type, duration_min, calories_burned, logged_at")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(5),
    ]);

    return {
      profile: profile.data,
      goals: goals.data,
      todayScans: todayScans.data || [],
      recentScans: recentScans.data || [],
      weightLogs: weightLogs.data || [],
      hydration: hydration.data,
      workouts: workouts.data || [],
    };
  } catch (err) {
    console.error("[CONTEXT] Error fetching:", err);
    return null;
  }
}

// ── Análise Nutricional Avançada ───────────────────────────
function analyzeNutrition(context) {
  if (!context) return null;

  const { todayScans, goals, profile, weightLogs } = context;

  // Totais de hoje
  const todayTotals = todayScans.reduce((acc, scan) => ({
    calories: acc.calories + (scan.calories || 0),
    protein: acc.protein + (scan.protein || 0),
    carbs: acc.carbs + (scan.carbs || 0),
    fat: acc.fat + (scan.fat || 0),
    fiber: acc.fiber + (scan.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Percentuais atingidos
  const percentages = goals ? {
    calories: Math.round((todayTotals.calories / goals.calories) * 100),
    protein: Math.round((todayTotals.protein / goals.protein) * 100),
    carbs: Math.round((todayTotals.carbs / goals.carbs) * 100),
    fat: Math.round((todayTotals.fat / goals.fat) * 100),
  } : null;

  // Progresso de peso
  let weightProgress = null;
  if (weightLogs && weightLogs.length >= 2) {
    const latest = weightLogs[0].weight;
    const oldest = weightLogs[weightLogs.length - 1].weight;
    const change = latest - oldest;
    const days = Math.ceil((new Date(weightLogs[0].logged_at) - new Date(weightLogs[weightLogs.length - 1].logged_at)) / (1000 * 60 * 60 * 24));

    weightProgress = {
      current: latest,
      change: change.toFixed(1),
      days,
      trend: change < 0 ? 'perdendo' : change > 0 ? 'ganhando' : 'mantendo',
    };
  }

  // Insights automáticos — sem emojis, linguagem direta de nutricionista
  const insights = [];

  if (percentages) {
    if (percentages.protein < 70) {
      insights.push(`Proteina abaixo da meta (${percentages.protein}%) — priorize fontes proteicas nas proximas refeicoes`);
    }
    if (percentages.calories > 110) {
      insights.push(`Calorias acima da meta diaria (${percentages.calories}%)`);
    }
    if (percentages.calories < 50 && todayScans.length > 0) {
      insights.push(`Ainda ha ${goals.calories - todayTotals.calories} kcal disponiveis para hoje`);
    }
  }

  if (todayTotals.fiber < 10 && todayScans.length >= 2) {
    insights.push(`Ingestao de fibras baixa — inclua vegetais ou graos integrais`);
  }

  if (weightProgress && profile?.goal === 'cutting' && weightProgress.change > 0) {
    insights.push(`Peso em alta — revise o deficit calorico`);
  }

  return {
    todayTotals,
    percentages,
    weightProgress,
    insights,
    mealsToday: todayScans.length,
  };
}

// ── System Prompt ──────────────────────────────────────────
// Diretrizes de qualidade do coach:
// - Sem emojis em nenhuma circunstância
// - Tom de nutricionista real: profissional, direto, baseado em evidências
// - Respostas curtas e objetivas — parágrafos de 2-3 frases no máximo
// - Usar dados reais do perfil e scans para personalizar, nunca respostas genéricas
// - Nunca inventar dados nutricionais; se incerto, dizer explicitamente
// - Bullet points para listas, negrito para termos importantes
// - Sempre em português brasileiro
function buildSystemPrompt(context, quick = false) {
  const analysis = analyzeNutrition(context);

  // Instrucoes base do coach — sem emojis, tom profissional
  let prompt = `Voce e NutriCoach, um nutricionista especialista em nutricao esportiva e emagrecimento.

COMPORTAMENTO:
- Responda sempre em portugues brasileiro
- Tom profissional e direto, como um nutricionista real falando com um paciente adulto
- Nunca use emojis em nenhuma circunstancia
- Nunca invente dados nutricionais — se nao tiver certeza de um valor, diga "nao tenho informacoes precisas sobre isso"
- Base suas recomendacoes em ciencia nutricional consolidada (nao em modismos)
- Respostas personalizadas usando os dados do perfil e scans do usuario — nunca respostas genericas

FORMATO:
${quick ? '- Resposta muito curta: maximo 2-3 frases, direto ao ponto' : '- Resposta concisa: maximo 4 paragrafos curtos (2-3 frases cada)'}
- Use bullet points quando listar opcoes ou alimentos
- Use **negrito** para termos nutricionais importantes
- Nunca use listas com mais de 5 itens`;

  if (!context) return prompt;

  const { profile, goals } = context;

  if (profile) {
    prompt += `\n\nPERFIL DO USUARIO:`;
    if (profile.full_name) prompt += `\nNome: ${profile.full_name}`;
    if (profile.age) prompt += ` | Idade: ${profile.age} anos`;
    if (profile.weight && profile.height) {
      const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
      prompt += `\nPeso: ${profile.weight}kg | Altura: ${profile.height}cm | IMC: ${bmi}`;
    }
    if (profile.goal) {
      const goalMap = {
        cutting: 'Reducao de gordura corporal',
        bulking: 'Ganho de massa muscular',
        maintain: 'Manutencao do peso atual'
      };
      prompt += `\nObjetivo: ${goalMap[profile.goal] || profile.goal}`;
    }
    if (profile.dietary_restrictions) {
      prompt += `\nRestricoes alimentares: ${profile.dietary_restrictions}`;
    }
  }

  if (goals) {
    prompt += `\n\nMETAS DIARIAS:`;
    prompt += `\nCalorias: ${goals.calories} kcal | Proteina: ${goals.protein}g | Carboidratos: ${goals.carbs}g | Gordura: ${goals.fat}g`;
  }

  if (analysis) {
    const { todayTotals, percentages, insights, mealsToday, weightProgress } = analysis;

    prompt += `\n\nCONSUMO DE HOJE (${mealsToday} refeicoes registradas):`;
    prompt += `\nCalorias: ${todayTotals.calories} kcal`;
    prompt += ` | Proteina: ${todayTotals.protein}g`;
    prompt += ` | Carboidratos: ${todayTotals.carbs}g`;
    prompt += ` | Gordura: ${todayTotals.fat}g`;
    prompt += ` | Fibras: ${todayTotals.fiber}g`;

    if (percentages) {
      prompt += `\nProgresso em relacao as metas: ${percentages.calories}% das calorias | ${percentages.protein}% da proteina | ${percentages.carbs}% dos carboidratos`;
    }

    if (insights.length > 0) {
      prompt += `\n\nALERTAS NUTRICIONAIS IDENTIFICADOS:`;
      insights.forEach(i => prompt += `\n- ${i}`);
    }

    if (weightProgress) {
      prompt += `\n\nEVOLUCAO DE PESO: ${weightProgress.current}kg (${weightProgress.change > 0 ? '+' : ''}${weightProgress.change}kg nos ultimos ${weightProgress.days} dias — tendencia: ${weightProgress.trend})`;
    }
  }

  prompt += `\n\nUse todos os dados acima para dar respostas especificas e uteis. Nunca ignore o contexto do usuario.`;

  return prompt;
}

// ── Anthropic API com Retry ────────────────────────────────
async function callAnthropicWithRetry(systemPrompt, messages, retries = 2) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODELS.ANTHROPIC_SONNET, // Sonnet para custo/performance
          max_tokens: 800,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages.slice(-10), // Limita contexto
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Se for erro de rate limit, tenta novamente
        if (response.status === 429 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`[RETRY] Rate limit, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;

      console.log(`[RETRY] Attempt ${attempt + 1} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

// ── Groq API ───────────────────────────────────────────────
async function callGroq(systemPrompt, messages, fast = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const model = fast ? MODELS.GROQ_FAST : MODELS.GROQ_SMART;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10),
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");

  return {
    content: [{ type: "text", text }],
    model,
    usage: {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
    },
  };
}

// ── Ollama Fallback ────────────────────────────────────────
async function callOllama(systemPrompt, messages) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODELS.OLLAMA_LLAMA,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

    const data = await response.json();
    
    if (!data.message?.content) {
      throw new Error(`Invalid Ollama response format: ${JSON.stringify(data).substring(0, 200)}`);
    }
    
    return {
      content: [{ type: 'text', text: data.message.content }],
      model: MODELS.OLLAMA_LLAMA,
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  } catch (error) {
    console.error('[OLLAMA] Failed:', error);
    throw error;
  }
}

// ── Handler Principal ──────────────────────────────────────
export default async function handler(req, res) {
  const requestId = `coach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log(`\n[${requestId}] 🤖 New chat request`);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validação
  let validated;
  try {
    validated = ChatRequestSchema.parse(req.body);
  } catch (err) {
    console.error(`[${requestId}] ❌ Validation failed:`, err);
    return res.status(400).json({
      error: "Dados inválidos",
      details: err.errors?.map(e => e.message) || [],
    });
  }

  const { conversationId, message, userId, useCache, quick } = validated;

  try {
    const supabase = getAdminSupabase();
    
    // Ensure chat tables exist (first request only)
    if (!global.chatTablesChecked) {
      console.log(`[${requestId}] 🔍 Checking chat table initialization...`);
      await ensureChatTablesExist(supabase);
      global.chatTablesChecked = true;
      console.log(`[${requestId}] ✅ Chat tables OK`);
    }
    
    // Verificar cache
    if (useCache) {
      const cached = getCachedResponse(userId, message);
      if (cached) {
        console.log(`[${requestId}] ⚡ Cache hit (${Date.now() - startTime}ms)`);
        return res.status(200).json({
          reply: cached,
          cached: true,
          provider: 'cache',
        });
      }
    }

    // Criar conversa se não existir
    let convId = conversationId;
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userId, title: 'Coach IA' })
        .select()
        .single();

      if (convError || !newConv) {
        throw new Error(`Failed to create conversation: ${convError?.message || 'No data returned'}`);
      }
      convId = newConv.id;
    }

    // Buscar contexto do usuário
    console.log(`[${requestId}] 📚 Fetching context...`);
    const userContext = await getUserContext(supabase, userId);
    if (!userContext) {
      console.warn(`[${requestId}] ⚠️  User context unavailable, using defaults`);
    }

    // Buscar histórico da conversa
    const { data: previousMessages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(10);
    
    if (messagesError) {
      console.warn(`[${requestId}] ⚠️  Failed to fetch previous messages:`, messagesError.message);
    }

    // Construir mensagens
    const apiMessages = [
      ...(previousMessages || []).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: "user", content: message },
    ];

    // Construir system prompt
    const systemPrompt = buildSystemPrompt(userContext, quick);

    console.log(`[${requestId}] 🧠 Calling AI (${apiMessages.length} messages)...`);

    // Chamar IA com fallback em cascata: Groq → Anthropic → Ollama
    let aiResponse;
    let provider = AI_PROVIDERS.GROQ;
    const aiProviderEnv = process.env.AI_PROVIDER || 'groq_with_fallback';
    const errors = [];

    // 1. Groq (padrão — rápido e gratuito)
    if (aiProviderEnv !== 'anthropic' && aiProviderEnv !== 'ollama') {
      try {
        aiResponse = await callGroq(systemPrompt, apiMessages, quick);
        console.log(`[${requestId}] ✅ Groq succeeded (${aiResponse.model})`);
      } catch (groqError) {
        console.warn(`[${requestId}] ⚠️  Groq failed:`, groqError.message);
        errors.push(`Groq: ${groqError.message}`);
      }
    }

    // 2. Anthropic (fallback ou primário)
    if (!aiResponse && aiProviderEnv !== 'ollama') {
      provider = AI_PROVIDERS.ANTHROPIC;
      try {
        aiResponse = await callAnthropicWithRetry(systemPrompt, apiMessages);
        console.log(`[${requestId}] ✅ Anthropic succeeded`);
      } catch (anthropicError) {
        console.warn(`[${requestId}] ⚠️  Anthropic failed:`, anthropicError.message);
        errors.push(`Anthropic: ${anthropicError.message}`);
      }
    }

    // 3. Ollama (último recurso local)
    if (!aiResponse) {
      provider = AI_PROVIDERS.OLLAMA;
      try {
        aiResponse = await callOllama(systemPrompt, apiMessages);
        console.log(`[${requestId}] ✅ Ollama succeeded`);
      } catch (ollamaError) {
        errors.push(`Ollama: ${ollamaError.message}`);
        throw new Error(`Todos os providers falharam: ${errors.join(' | ')}`);
      }
    }

    const assistantMessage = aiResponse.content?.find(b => b.type === "text")?.text;
    if (!assistantMessage) {
      throw new Error("Empty AI response");
    }

    const tokensUsed = (aiResponse.usage?.input_tokens || 0) + (aiResponse.usage?.output_tokens || 0);

    // Salvar mensagens no banco
    const { error: saveError } = await supabase.from("chat_messages").insert([
      {
        conversation_id: convId,
        user_id: userId,
        role: "user",
        content: message,
      },
      {
        conversation_id: convId,
        user_id: userId,
        role: "assistant",
        content: assistantMessage,
        model: aiResponse.model,
        tokens_used: tokensUsed,
      },
    ]);
    
    if (saveError) {
      console.warn(`[${requestId}] ⚠️  Failed to save messages:`, saveError.message);
    }

    // Atualizar conversa
    await supabase
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);

    // Cachear resposta
    if (useCache) {
      setCachedResponse(userId, message, assistantMessage);
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Success (${duration}ms, ${tokensUsed} tokens, ${provider})`);

    return res.status(200).json({
      reply: assistantMessage, // ✅ CORREÇÃO: reply ao invés de message
      conversationId: convId,
      provider,
      tokensUsed,
      duration,
      cached: false,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error (${duration}ms):`, error.message);

    return res.status(500).json({
      error: "Erro ao processar mensagem",
      message: error.message,
      requestId,
    });
  }
}
