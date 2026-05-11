import { supabase } from '@/services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FastingSession {
  id: string;
  user_id: string;
  protocol: '12:12' | '16:8' | '18:6' | '24h';
  started_at: string;
  ended_at: string | null;
  completed: boolean;
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Busca sessão de jejum ativa (sem ended_at).
 */
export async function getActiveFasting(userId: string): Promise<FastingSession | null> {
  const { data, error } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data as FastingSession | null;
}

/**
 * Inicia uma nova sessão de jejum.
 * Encerra automaticamente qualquer sessão ativa anterior antes de criar a nova.
 */
export async function startFasting(
  userId: string,
  protocol: '12:12' | '16:8' | '18:6' | '24h',
): Promise<FastingSession> {
  // Encerra sessão ativa anterior, se houver, para evitar duplicatas
  const existing = await getActiveFasting(userId);
  if (existing) {
    const { error: endError } = await supabase
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), completed: false })
      .eq('id', existing.id)
      .eq('user_id', userId); // garante que só encerra sessão do próprio usuário
    if (endError) throw endError;
  }

  const { data, error } = await supabase
    .from('fasting_sessions')
    .insert({
      user_id: userId,
      protocol,
      started_at: new Date().toISOString(),
      ended_at: null,
      completed: false,
    })
    .select()
    .single();

  if (error) throw error;

  return data as FastingSession;
}

/**
 * Encerra uma sessão de jejum existente.
 * Filtra por user_id para garantir que apenas o dono pode encerrar a sessão.
 */
export async function endFasting(
  sessionId: string,
  userId: string,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('fasting_sessions')
    .update({
      ended_at: new Date().toISOString(),
      completed,
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Busca histórico das últimas 7 sessões de jejum encerradas.
 */
export async function getFastingHistory(userId: string): Promise<FastingSession[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', sevenDaysAgo)
    .order('started_at', { ascending: false })
    .limit(7);

  if (error) throw error;

  return (data ?? []) as FastingSession[];
}
