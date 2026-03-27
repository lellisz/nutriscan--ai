import { getSupabaseClient } from "./supabase";

function supabase() {
  return getSupabaseClient();
}

async function ensureSession() {
  const client = supabase();
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  return session;
}

export async function getCurrentUser() {
  const client = supabase();
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signUpWithEmail({ email, password, metadata = {} }) {
  const client = supabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail({ email, password }) {
  const client = supabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const client = supabase();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getProfile(userId) {
  const client = supabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile(userId, profile) {
  await ensureSession();
  const client = supabase();
  const payload = {
    user_id: userId,
    full_name: profile.full_name ?? profile.fullName ?? null,
    age: profile.age ?? null,
    gender: profile.gender ?? null,
    weight: profile.weight ?? null,
    height: profile.height ?? null,
    activity_level: profile.activity_level ?? profile.activityLevel ?? null,
    goal: profile.goal ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getDailyGoals(userId) {
  const client = supabase();
  const { data, error } = await client
    .from("daily_goals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveDailyGoals(userId, goals) {
  await ensureSession();
  const client = supabase();
  const payload = {
    user_id: userId,
    calories: goals.calories ?? null,
    protein: goals.protein ?? null,
    carbs: goals.carbs ?? null,
    fat: goals.fat ?? null,
    fiber: goals.fiber ?? null,
    water: goals.water ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("daily_goals")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * @deprecated NAO USE NO FRONTEND. O campo is_premium e protegido por RLS policy
 * que impede o usuario de alterar via token anonimo. Esta funcao so funciona quando
 * chamada pelo backend com service_role. Mantida apenas para compatibilidade;
 * em producao, o upgrade premium deve ser feito via webhook do payment provider.
 */
export async function updatePremiumStatus(userId, isPremium) {
  console.warn("[SECURITY] updatePremiumStatus chamada no frontend — operacao bloqueada por RLS");
  const client = supabase();
  const { data, error } = await client
    .from("profiles")
    .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listScanHistory(userId, limit = 20) {
  const client = supabase();
  const { data, error } = await client
    .from("scan_history")
    .select("*")
    .eq("user_id", userId)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Lista todos os scans do usuario no dia atual (fuso horario local do servidor, ISO date).
 * Util para calcular totais de macros do dia e construir o contexto do veredicto.
 *
 * @param {string} userId
 * @param {string} [date] - Data no formato YYYY-MM-DD. Padrao: hoje.
 * @returns {Promise<Array>}
 */
export async function listScansToday(userId, date = null) {
  const client = supabase();
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await client
    .from("scan_history")
    .select("id, food_name, calories, protein, carbs, fat, fiber, sugar, sodium, portion, category, confidence, scanned_at")
    .eq("user_id", userId)
    .gte("scanned_at", `${targetDate}T00:00:00.000Z`)
    .lt("scanned_at", `${targetDate}T23:59:59.999Z`)
    .order("scanned_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Calcula os totais nutricionais do usuario para o dia especificado.
 * Retorna zeros quando nao ha scans registrados.
 *
 * @param {string} userId
 * @param {string} [date] - Data no formato YYYY-MM-DD. Padrao: hoje.
 * @returns {Promise<{ calories: number, protein: number, carbs: number, fat: number, fiber: number, sugar: number, sodium: number, meals: number }>}
 */
export async function getTodayNutritionTotals(userId, date = null) {
  const scans = await listScansToday(userId, date);

  const totals = scans.reduce(
    (acc, scan) => ({
      calories: acc.calories + (scan.calories || 0),
      protein: acc.protein + (scan.protein || 0),
      carbs: acc.carbs + (scan.carbs || 0),
      fat: acc.fat + (scan.fat || 0),
      fiber: acc.fiber + (scan.fiber || 0),
      sugar: acc.sugar + (scan.sugar || 0),
      sodium: acc.sodium + (scan.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  return { ...totals, meals: scans.length };
}

export async function updateScanHistory(scanId, updates, userId = null) {
  const client = supabase();
  // Defesa em profundidade: filtrar por user_id alem do id do scan
  // Mesmo com RLS ativo, isso previne IDOR se o RLS falhar
  let query = client
    .from("scan_history")
    .update({
      food_name: updates.food_name,
      calories: updates.calories,
      protein: updates.protein,
      carbs: updates.carbs,
      fat: updates.fat,
      fiber: updates.fiber,
      sugar: updates.sugar,
      sodium: updates.sodium,
      portion: updates.portion,
      status: "verified",
      user_notes: updates.user_notes || null,
    })
    .eq("id", scanId);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteScanHistory(scanId, userId = null) {
  const client = supabase();
  // Defesa em profundidade: filtrar por user_id alem do id do scan
  let query = client.from("scan_history").delete().eq("id", scanId);
  if (userId) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

export async function saveScanHistory({ userId, imageUrl = null, analysis, scannedAt, requestId = null }) {
  const client = supabase();
  const payload = {
    request_id: requestId,
    user_id: userId,
    image_url: imageUrl,
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
    scanned_at: scannedAt ?? new Date().toISOString(),
  };

  const { data, error } = await client
    .from("scan_history")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ==================== Weight Logs ====================

export async function listWeightLogs(userId, limit = 90) {
  const client = supabase();
  const { data, error } = await client
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function saveWeightLog(userId, { weight, note = null, loggedAt = null }) {
  const client = supabase();
  const today = loggedAt || new Date().toISOString().split("T")[0];

  // Upsert: se já registrou peso hoje, atualiza
  const { data, error } = await client
    .from("weight_logs")
    .upsert(
      { user_id: userId, weight, note, logged_at: today },
      { onConflict: "user_id,logged_at" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWeightLog(id, userId = null) {
  const client = supabase();
  // Defesa em profundidade: filtrar por user_id alem do id
  let query = client.from("weight_logs").delete().eq("id", id);
  if (userId) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

// ==================== Workout Logs ====================

export async function listWorkoutLogs(userId, limit = 50) {
  const client = supabase();
  const { data, error } = await client
    .from("workout_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function saveWorkoutLog(userId, { workoutType, durationMin, caloriesBurned = null, intensity = null, note = null, loggedAt = null }) {
  const client = supabase();
  const { data, error } = await client
    .from("workout_logs")
    .insert({
      user_id: userId,
      workout_type: workoutType,
      duration_min: durationMin,
      calories_burned: caloriesBurned,
      intensity,
      note,
      logged_at: loggedAt || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkoutLog(id, userId = null) {
  const client = supabase();
  // Defesa em profundidade: filtrar por user_id alem do id
  let query = client.from("workout_logs").delete().eq("id", id);
  if (userId) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

// ==================== Hydration Logs ====================

export async function getHydrationToday(userId) {
  const client = supabase();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await client
    .from("hydration_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("logged_at", today)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveHydration(userId, glasses) {
  const client = supabase();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await client
    .from("hydration_logs")
    .upsert(
      { user_id: userId, glasses, logged_at: today },
      { onConflict: "user_id,logged_at" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== COACH IA - CHAT ====================

/**
 * Lista todas as conversas do usuário
 */
export async function listChatConversations(userId, limit = 20) {
  const client = supabase();
  try {
    const { data, error } = await client
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === "PGRST116") {
        console.warn("[DB] Chat tables not initialized - using empty list");
        return [];
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.error("[DB] Error listing conversations:", err.message);
    return [];
  }
}

/**
 * Cria uma nova conversa
 */
export async function createChatConversation(userId, title = null) {
  const client = supabase();
  try {
    const { data, error } = await client
      .from("chat_conversations")
      .insert({
        user_id: userId,
        title: title || "Nova conversa",
        message_count: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.error("[DB] Chat tables not initialized. Run migration: supabase/migrations/20260317_coach_ia.sql");
        throw new Error("Chat feature not initialized. Please contact support.");
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.error("[DB] Error creating conversation:", err.message);
    throw err;
  }
}

/**
 * Atualiza uma conversa (título, resumo, contadores)
 */
export async function updateChatConversation(conversationId, updates, userId = null) {
  const client = supabase();
  // Defesa em profundidade: filtrar por user_id alem do id
  let query = client
    .from("chat_conversations")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.select().single();

  if (error) throw error;
  return data;
}

/**
 * Deleta uma conversa (cascade delete nas mensagens)
 */
export async function deleteChatConversation(conversationId, userId = null) {
  const client = supabase();
  // Defesa em profundidade: filtrar por user_id alem do id
  let query = client.from("chat_conversations").delete().eq("id", conversationId);
  if (userId) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

/**
 * Lista mensagens de uma conversa
 */
export async function listChatMessages(conversationId, limit = 100) {
  const client = supabase();
  const { data, error } = await client
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Adiciona uma mensagem à conversa e atualiza contadores
 */
/**
 * Retorna soma diária de macros dos últimos N dias
 * @param {string} userId
 * @param {number} days - 7 ou 30
 * @returns {Promise<Array>}
 */
export async function getDailyMacros(userId, days = 7) {
  const client = supabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await client
    .from('scan_history')
    .select('calories, protein, carbs, fat, scanned_at')
    .eq('user_id', userId)
    .gte('scanned_at', since.toISOString())
    .order('scanned_at', { ascending: true });

  if (error) throw error;

  // Agrupar por data local (YYYY-MM-DD)
  const byDate = {};
  (data || []).forEach(row => {
    const dateStr = new Date(row.scanned_at).toLocaleDateString('fr-CA');
    if (!byDate[dateStr]) {
      byDate[dateStr] = { date: dateStr, calories: 0, protein: 0, carbs: 0, fat: 0, mealsCount: 0 };
    }
    byDate[dateStr].calories   += (row.calories || 0);
    byDate[dateStr].protein    += (row.protein  || 0);
    byDate[dateStr].carbs      += (row.carbs    || 0);
    byDate[dateStr].fat        += (row.fat      || 0);
    byDate[dateStr].mealsCount += 1;
  });

  // Preencher dias sem dados
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('fr-CA');
    result.push(byDate[dateStr] || {
      date: dateStr, calories: 0, protein: 0, carbs: 0, fat: 0, mealsCount: 0
    });
  }

  return result;
}

/**
 * Resumo do período (médias + melhor dia + dias na meta)
 * @param {string} userId
 * @param {number} days
 * @param {number} caloriesGoal
 * @returns {Promise<Object>}
 */
export async function getPeriodSummary(userId, days = 7, caloriesGoal = 2000) {
  const data = await getDailyMacros(userId, days);
  const daysWithData = data.filter(d => d.calories > 0);

  if (daysWithData.length === 0) {
    return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, daysOnGoal: 0, totalDays: days, bestDay: null };
  }

  const total = daysWithData.reduce((acc, d) => ({
    calories: acc.calories + d.calories,
    protein:  acc.protein  + d.protein,
    carbs:    acc.carbs    + d.carbs,
    fat:      acc.fat      + d.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const count = daysWithData.length;
  const bestDay = daysWithData.reduce((best, d) => d.calories > (best?.calories ?? 0) ? d : best, null);
  const daysOnGoal = daysWithData.filter(d => d.calories >= caloriesGoal * 0.9 && d.calories <= caloriesGoal * 1.1).length;

  return {
    avgCalories: Math.round(total.calories / count),
    avgProtein:  Math.round(total.protein  / count),
    avgCarbs:    Math.round(total.carbs    / count),
    avgFat:      Math.round(total.fat      / count),
    daysOnGoal,
    totalDays:   days,
    bestDay,
  };
}

// ==================== COACH IA - CHAT ====================

export async function addChatMessage(conversationId, userId, { role, content, model = null, tokensUsed = null, contextUsed = null }) {
  const client = supabase();

  // Inserir mensagem
  const { data: message, error: msgError } = await client
    .from("chat_messages")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      model,
      tokens_used: tokensUsed,
      context_used: contextUsed,
    })
    .select()
    .single();

  if (msgError) throw msgError;

  // Atualizar contador e timestamp da conversa
  const { data: conversation } = await client
    .from("chat_conversations")
    .select("message_count")
    .eq("id", conversationId)
    .single();

  await client
    .from("chat_conversations")
    .update({
      message_count: (conversation?.message_count || 0) + 1,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return message;
}