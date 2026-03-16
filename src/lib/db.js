import { getSupabaseClient } from "./supabase";

function supabase() {
  return getSupabaseClient();
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