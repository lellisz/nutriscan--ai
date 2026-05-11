import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Colors, fonts } from '@/constants/design';
import { supabase } from '@/services/supabase';

interface AiInsight {
  text: string;
  sub?: string;
}

async function fetchAiInsight(userId: string): Promise<AiInsight | null> {
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data, error } = await supabase
    .from('meals')
    .select('logged_at, meal_type, calories')
    .eq('user_id', userId)
    .gte('logged_at', since.toISOString())
    .not('meal_type', 'is', null)
    .order('logged_at', { ascending: false })
    .limit(50);

  if (error || !data || data.length < 3) return null;

  const hours = data.map((r) => new Date(r.logged_at ?? new Date()).getHours());
  const freq = hours.reduce<Record<number, number>>((acc, h) => {
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, {});
  const peakHour = parseInt(
    Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
  );

  const mealFreq = (data as Array<{ meal_type: string }>).reduce<Record<string, number>>((acc, r) => {
    acc[r.meal_type] = (acc[r.meal_type] ?? 0) + 1;
    return acc;
  }, {});
  const topMeal = Object.entries(mealFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

  const mealNames: Record<string, string> = {
    breakfast: 'café da manhã',
    lunch: 'almoço',
    dinner: 'jantar',
    snack: 'lanche',
  };

  const uniqueDays = new Set(
    data.map((r) => new Date(r.logged_at ?? new Date()).toISOString().slice(0, 10))
  ).size;

  if (uniqueDays < 3) return null;

  const period = peakHour < 12 ? 'manhã' : peakHour < 18 ? 'tarde' : 'noite';

  const insights: AiInsight[] = [
    {
      text: `Você registra melhor no período da ${period}.`,
      sub: `Padrão identificado nos últimos ${uniqueDays} dias.`,
    },
    topMeal
      ? {
          text: `${mealNames[topMeal] ?? topMeal} é sua refeição mais consistente.`,
          sub: 'Continue — consistência é o que gera resultados.',
        }
      : {
          text: `${uniqueDays} dias de dados analisados.`,
          sub: 'Praxi está aprendendo seus padrões.',
        },
    {
      text: `Você tem ${uniqueDays} dias de histórico nutricional.`,
      sub: 'Quanto mais dados, mais preciso o Coach Praxi fica.',
    },
  ];

  // Deterministic seed by userId + day-of-month — stable within the day, varies daily
  const seed = (userId.charCodeAt(0) + new Date().getDate()) % insights.length;
  return insights[seed];
}

interface AiLearningProps {
  userId: string | undefined;
}

export function AiLearning({ userId }: AiLearningProps) {
  const { data: insight } = useQuery({
    queryKey: ['ai-insight', userId],
    queryFn: () => fetchAiInsight(userId!),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000,
  });

  if (!insight) return null;

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()}>
      <View
        accessibilityRole="text"
        accessibilityLabel={`Praxi notou: ${insight.text}${insight.sub ? '. ' + insight.sub : ''}`}
        style={{
          marginHorizontal: 12,
          marginBottom: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderLeftWidth: 1,
          borderLeftColor: Colors.gold,
          backgroundColor: Colors.c1,
        }}
      >
        <Text style={{
          fontFamily: fonts.sansLight,
          fontSize: 9,
          color: Colors.gold,
          letterSpacing: 1.6,
          marginBottom: 5,
          textTransform: 'uppercase',
        }}>
          Praxi notou
        </Text>
        <Text style={{
          fontFamily: fonts.serifLight,
          fontSize: 14,
          color: Colors.t1,
          lineHeight: 20,
        }}>
          {insight.text}
        </Text>
        {insight.sub && (
          <Text style={{
            fontFamily: fonts.sansLight,
            fontSize: 11,
            color: Colors.t3,
            marginTop: 3,
          }}>
            {insight.sub}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
