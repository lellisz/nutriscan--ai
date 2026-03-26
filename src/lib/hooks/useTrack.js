import { getSupabaseClient } from '../supabase';

/**
 * Hook de analytics proprio — fire-and-forget.
 * Persiste eventos na tabela analytics_events (Supabase).
 * Erros sao engolidos silenciosamente para nao quebrar a app.
 */
export function useTrack() {
  async function track(eventType, metadata = {}) {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      await supabase.from('analytics_events').insert({
        user_id: session.user.id,
        event_type: eventType,
        metadata,
      });
    } catch {
      // silent — analytics nao pode quebrar a app
    }
  }

  return { track };
}
