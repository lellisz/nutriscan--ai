import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { DailyTotals, NutritionGoals } from "@/types";
import type { Tables } from "@/types/database";

type Meal = Tables<'meals'>;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function useDailyNutrition(date = todayISO()) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["nutrition", "daily", user?.id, date],
    queryFn: async () => {
      if (!user) throw new Error("Não autenticado");

      // Busca refeições do dia (de `meals`, schema v3)
      const { data: meals, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", `${date}T00:00:00`)
        .lte("logged_at", `${date}T23:59:59`)
        .order("logged_at", { ascending: true });

      if (mealsError) throw mealsError;

      // Metas: lê de `profiles.*_target` (substitui tabela legada `daily_goals`)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("calories_target, protein_target, hydration_target")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      const items = (meals ?? []) as Meal[];
      const totals: DailyTotals = items.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories ?? 0),
          protein: acc.protein + (m.protein ?? 0),
          carbs: acc.carbs + (m.carbs ?? 0),
          fat: acc.fat + (m.fat ?? 0),
          fiber: acc.fiber + (m.fiber ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      const goals: Partial<NutritionGoals> | null = profile
        ? {
            calories: profile.calories_target ?? 0,
            protein: profile.protein_target ?? 0,
          }
        : null;

      return { meals: items, totals, goals };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (mealId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutrition", "daily", user?.id] });
    },
  });
}
