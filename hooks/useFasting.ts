import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  getActiveFasting,
  getFastingHistory,
  startFasting as startFastingService,
  endFasting as endFastingService,
  FastingSession,
} from '@/services/fasting';
import { useDailyStore } from '@/stores/dailyStore';

const QUERY_KEY = 'fasting';

export function useFasting() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { startFasting: storeStartFasting, stopFasting: storeStopFasting } =
    useDailyStore();

  // ── Sessão ativa ──────────────────────────────────────────────────────────

  const {
    data: activeFasting,
    isLoading: isLoadingActive,
  } = useQuery<FastingSession | null>({
    queryKey: [QUERY_KEY, 'active', user?.id],
    queryFn: () => {
      if (!user) throw new Error('Não autenticado');
      return getActiveFasting(user.id);
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // ── Histórico 7 dias ──────────────────────────────────────────────────────

  const {
    data: history,
    isLoading: isLoadingHistory,
  } = useQuery<FastingSession[]>({
    queryKey: [QUERY_KEY, 'history', user?.id],
    queryFn: () => {
      if (!user) throw new Error('Não autenticado');
      return getFastingHistory(user.id);
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // ── Iniciar jejum ─────────────────────────────────────────────────────────

  const startMutation = useMutation({
    mutationFn: async (protocol: '12:12' | '16:8' | '18:6' | '24h') => {
      if (!user) throw new Error('Não autenticado');
      const session = await startFastingService(user.id, protocol);
      // Sincroniza com o store local
      storeStartFasting(protocol, session.started_at);
      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'active', user?.id] });
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'history', user?.id] });
    },
    onError: (error: Error) => {
      console.error('Erro ao iniciar jejum:', error.message);
    },
  });

  // ── Encerrar jejum ────────────────────────────────────────────────────────

  const endMutation = useMutation({
    mutationFn: async ({
      sessionId,
      completed,
    }: {
      sessionId: string;
      completed: boolean;
    }) => {
      if (!user) throw new Error('Não autenticado');
      await endFastingService(sessionId, user.id, completed);
      // Limpa o store local
      storeStopFasting();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'active', user?.id] });
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'history', user?.id] });
    },
    onError: (error: Error) => {
      console.error('Erro ao encerrar jejum:', error.message);
    },
  });

  return {
    activeFasting: activeFasting ?? null,
    history: history ?? [],
    isLoading: isLoadingActive || isLoadingHistory,
    startFasting: (protocol: '12:12' | '16:8' | '18:6' | '24h') =>
      startMutation.mutateAsync(protocol),
    endFasting: (sessionId: string, completed: boolean) =>
      endMutation.mutateAsync({ sessionId, completed }),
    isStarting: startMutation.isPending,
    isEnding: endMutation.isPending,
  };
}
