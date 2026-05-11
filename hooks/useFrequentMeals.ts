import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/services/supabase";

const FrequentMealSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  count: z.number(),
});

export type FrequentMeal = z.infer<typeof FrequentMealSchema>;

/**
 * Busca refeições frequentes da tabela canônica `frequent_meals`.
 * Top 5 por contagem, ordenadas desc.
 */
async function fetchFrequentMeals(userId: string): Promise<FrequentMeal[]> {
  const { data, error } = await supabase
    .from("frequent_meals")
    .select("id, name, calories, protein, carbs, fat, count")
    .eq("user_id", userId)
    .order("count", { ascending: false })
    .limit(5);

  if (error) throw error;

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    carbs: row.carbs ?? 0,
    fat: row.fat ?? 0,
    count: row.count ?? 0,
  }));

  return z.array(FrequentMealSchema).parse(rows);
}

export function useFrequentMeals(userId: string | undefined) {
  return useQuery<FrequentMeal[]>({
    queryKey: ["frequent-meals", userId],
    queryFn: () => fetchFrequentMeals(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
