import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface StreakResult {
  loggedToday: boolean;
  streak: number;
}

/**
 * Verifica se o erro indica que a tabela `streak_state` ainda não existe
 * (Agent 1 vai criá-la em migration 008). Nesse caso, retornamos um mock
 * graceful em vez de falhar a UI.
 */
function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === '42P01' ||
    (typeof e.message === 'string' && /streak_state|relation .* does not exist/i.test(e.message))
  );
}

/**
 * Calcula o streak por janela de 30 dias usando `meals.logged_at`.
 * Fallback usado quando `streak_state` ainda não está disponível.
 */
async function computeStreakFromMeals(userId: string): Promise<StreakResult> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from('meals')
    .select('logged_at')
    .eq('user_id', userId)
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: false })
    .limit(500);

  if (error || !data?.length) return { streak: 0, loggedToday: false };

  // Use consistent YYYY-MM-DD in America/Sao_Paulo timezone
  const toLocalDay = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);

  const days = new Set(
    data
      .map((r) => r.logged_at)
      .filter((v): v is string => typeof v === 'string')
      .map((v) => toLocalDay(new Date(v))),
  );

  const today = new Date();
  const todayStr = toLocalDay(today);
  const loggedToday = days.has(todayStr);

  let streak = 0;
  const cursor = new Date(today);
  if (!loggedToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 31; i++) {
    const key = toLocalDay(cursor);
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, loggedToday };
}

async function fetchStreak(userId: string): Promise<StreakResult> {
  // Tenta a tabela canônica `streak_state` (Agent 1, migration 008)
  try {
    const { data, error } = await supabase
      .from('streak_state')
      .select('current_streak, last_logged_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return computeStreakFromMeals(userId);
      }
      // Outros erros: cai no fallback também (graceful UI)
      return computeStreakFromMeals(userId);
    }

    if (!data) {
      return computeStreakFromMeals(userId);
    }

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());

    const loggedToday = data.last_logged_date === today;
    return {
      streak: data.current_streak ?? 0,
      loggedToday,
    };
  } catch (err) {
    if (isMissingTableError(err)) {
      return computeStreakFromMeals(userId);
    }
    return { streak: 0, loggedToday: false };
  }
}

export function useStreak(userId: string | undefined) {
  return useQuery<StreakResult>({
    queryKey: ['streak', userId],
    queryFn: () => fetchStreak(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    placeholderData: { streak: 0, loggedToday: false },
  });
}
