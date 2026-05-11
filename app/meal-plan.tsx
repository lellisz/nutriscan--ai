import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, fonts, fontSizes } from '@/constants/design';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';

interface Meal {
  name: string;
  kcal: number;
  prot: number;
  carbs: number;
  fat: number;
}

interface DayPlan {
  day: number;
  meals: Meal[];
}

export default function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;
      if (!session) {
        throw new Error('Nao autenticado');
      }

      const apiBase =
        process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://nutriscan-ai.vercel.app/api';

      const response = await fetch(`${apiBase}/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_type: 'meal_plan',
          calories: profile?.calories_target ?? 2100,
          protein: profile?.protein_target ?? 150,
          carbs: 240,
          fat: 70,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar plano');
      }

      const data = await response.json();

      // Parse response - expected format from coach
      if (data.plan && Array.isArray(data.plan)) {
        setPlan(data.plan);
      } else {
        // Fallback: generate mock plan for testing
        const mockPlan: DayPlan[] = [
          {
            day: 1,
            meals: [
              { name: 'Cafe da manha: Ovos + Pao integral', kcal: 350, prot: 22, carbs: 30, fat: 15 },
              { name: 'Almoco: Frango grelhado + Arroz + Salada', kcal: 550, prot: 45, carbs: 55, fat: 12 },
              { name: 'Lanche: Iogurte grego + Banana', kcal: 200, prot: 15, carbs: 25, fat: 5 },
              { name: 'Jantar: Peixe + Legumes', kcal: 400, prot: 35, carbs: 20, fat: 18 },
            ],
          },
          {
            day: 2,
            meals: [
              { name: 'Cafe da manha: Vitamina de banana + Whey', kcal: 300, prot: 28, carbs: 35, fat: 8 },
              { name: 'Almoco: Carne moida + Batata doce', kcal: 520, prot: 40, carbs: 50, fat: 15 },
              { name: 'Lanche: Mix de castanhas', kcal: 180, prot: 6, carbs: 10, fat: 14 },
              { name: 'Jantar: Omelete + Salada', kcal: 380, prot: 28, carbs: 12, fat: 22 },
            ],
          },
          {
            day: 3,
            meals: [
              { name: 'Cafe da manha: Tapioca + Queijo cottage', kcal: 280, prot: 20, carbs: 38, fat: 6 },
              { name: 'Almoco: Salmao + Quinoa + Brocolis', kcal: 580, prot: 42, carbs: 45, fat: 20 },
              { name: 'Lanche: Frutas + Pasta de amendoim', kcal: 220, prot: 8, carbs: 28, fat: 10 },
              { name: 'Jantar: Frango desfiado + Legumes', kcal: 420, prot: 38, carbs: 22, fat: 16 },
            ],
          },
        ];
        setPlan(mockPlan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const generateShoppingList = () => {
    if (!plan) return;

    const allMeals = plan.flatMap((day) => day.meals.map((m) => m.name));
    const listText = `LISTA DE COMPRAS - PRAXIS\n\n${allMeals.join('\n')}`;

    Share.share({
      message: listText,
      title: 'Lista de Compras',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>x VOLTAR</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>PLANO . 3 DIAS</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GROQ AI</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {!plan && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Gere seu plano personalizado</Text>
            <Text style={styles.emptyDesc}>
              O Coach Praxi vai criar um plano de 3 dias baseado nas suas metas
              de calorias e macros.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.generateBtn,
                pressed && styles.generateBtnPressed,
              ]}
              onPress={generatePlan}
            >
              <Text style={styles.generateBtnText}>GERAR PLANO</Text>
            </Pressable>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator color={Colors.t1} size="large" />
            <Text style={styles.loadingText}>Gerando plano...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={generatePlan}>
              <Text style={styles.retryBtnText}>TENTAR NOVAMENTE</Text>
            </Pressable>
          </View>
        )}

        {plan && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScroll}
            >
              {plan.map((dayPlan) => (
                <View key={dayPlan.day} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>DIA {dayPlan.day}</Text>
                  {dayPlan.meals.map((meal, idx) => (
                    <View key={idx} style={styles.mealItem}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <View style={styles.mealMacros}>
                        <Text style={styles.macroText}>{meal.kcal} kcal</Text>
                        <Text style={styles.macroText}>{meal.prot}g prot</Text>
                        <Text style={styles.macroText}>{meal.carbs}g carbs</Text>
                        <Text style={styles.macroText}>{meal.fat}g gord</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && styles.actionBtnPressed,
                ]}
                onPress={() => {
                  // TODO: Registrar em lote
                }}
              >
                <Text style={styles.actionBtnText}>REGISTRAR TUDO HOJE</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnSecondary,
                  pressed && styles.actionBtnPressed,
                ]}
                onPress={generateShoppingList}
              >
                <Text style={styles.actionBtnSecondaryText}>
                  LISTA DE COMPRAS
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.regenerateBtn}
              onPress={generatePlan}
            >
              <Text style={styles.regenerateBtnText}>GERAR NOVO PLANO</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b1,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
    letterSpacing: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes['2xl'],
    color: Colors.t1,
  },
  badge: {
    backgroundColor: Colors.c2,
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    color: Colors.gold,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes.xl,
    color: Colors.t1,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  generateBtn: {
    backgroundColor: Colors.t1,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  generateBtnPressed: {
    opacity: 0.9,
  },
  generateBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: Colors.bg,
    letterSpacing: 2,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: '#c47e6e',
    textAlign: 'center',
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: Colors.t2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t2,
    letterSpacing: 2,
  },
  daysScroll: {
    gap: 16,
    paddingBottom: 8,
  },
  dayCard: {
    width: 280,
    backgroundColor: Colors.c1,
    borderWidth: 1,
    borderColor: Colors.b1,
    borderRadius: 12,
    padding: 16,
  },
  dayTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: Colors.t1,
    letterSpacing: 2,
    marginBottom: 16,
  },
  mealItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b1,
  },
  mealName: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t2,
    marginBottom: 6,
  },
  mealMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroText: {
    fontFamily: fonts.monoLight,
    fontSize: 10,
    color: Colors.t4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.t1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPressed: {
    opacity: 0.9,
  },
  actionBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.bg,
    letterSpacing: 1,
  },
  actionBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.b2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t2,
    letterSpacing: 1,
  },
  regenerateBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  regenerateBtnText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
    letterSpacing: 2,
  },
});
