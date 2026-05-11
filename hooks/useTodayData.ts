import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getTodayLog, getTodayMeals, DailyLog, Meal } from '@/services/daily';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface TodayData {
  log: DailyLog | null;
  meals: Meal[];
}

export function useTodayData() {
  const { user } = useAuthStore();
  const today = todayISO();

  const { data, isLoading, refetch } = useQuery<TodayData>({
    queryKey: ['today', user?.id, today],
    queryFn: async () => {
      if (!user) throw new Error('Não autenticado');

      const [log, meals] = await Promise.all([
        getTodayLog(user.id),
        getTodayMeals(user.id),
      ]);

      return { log, meals };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  return {
    log: data?.log ?? null,
    meals: data?.meals ?? [],
    isLoading,
    refetch,
  };
}
