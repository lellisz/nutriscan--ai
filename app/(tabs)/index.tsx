import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Polygon } from 'react-native-svg';
import { Colors, fonts } from '@/constants/design';
import { Colors as SpecColors } from '@/constants/Colors';
import { useDailyNutrition } from '@/hooks/useNutrition';
import { useTodayData } from '@/hooks/useTodayData';
import { useAuthStore } from '@/stores/authStore';
import { useDailyStore, DailyContext } from '@/stores/dailyStore';
import { upsertDailyLog } from '@/services/daily';
import { calculateScore } from '@/services/score';
import { Card } from '@/components/ui/Card';
import { VLine } from '@/components/ui/VLine';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { AnimatedBar } from '@/components/ui/AnimatedBar';
import { AiLearning } from '@/components/ui/AiLearning';
import { useHydrationStore } from '@/stores/hydrationStore';
import { MealTimeline, TimelineMeal } from '@/components/ui/MealTimeline';
import { ContextSelector } from '@/components/ui/ContextSelector';
import { useStreak } from '@/hooks/useStreak';
import { PressableScale } from '@/components/ui/PressableScale';
import { CalorieRing } from '@/components/ui/CalorieRing';
import { MetallicButton } from '@/components/ui/MetallicButton';

// ─── Context messages ────────────────────────────────────────────────────────

const CONTEXT_COPY: Record<
  DailyContext,
  { msg: string; sug: string; sub: string }
> = {
  normal:    { msg: 'Bom progresso hoje',                  sug: 'Frango grelhado + salada verde',     sub: '+48g prot · 280 kcal · fecha suas metas' },
  stress:    { msg: 'Dia difícil — meta ajustada.',         sug: 'Iogurte grego + fruta',              sub: 'Leve, fácil de registrar · 220 kcal'     },
  travel:    { msg: 'Modo viagem ativo.',                   sug: 'Diga o restaurante ao Coach',        sub: 'Modo restaurante disponível'              },
  celebrate: { msg: 'Aproveite! Voltamos amanhã.',          sug: 'Curta o momento',                    sub: 'Score não penaliza hoje'                  },
  hard:      { msg: 'Modo Compaixão ativo.',                sug: 'Água primeiro · depois uma refeição leve', sub: 'Score de recomeço: sem punição'    },
  restricao: { msg: 'Restrição alimentar ativa.',           sug: 'Informe suas restrições ao Coach',   sub: 'Plano adaptado disponível'                },
  academia:  { msg: 'Dia de treino pesado.',                sug: 'Priorize proteína e recuperação',    sub: 'TDEE aumentado hoje'                      },
};

// ─── Day label helper ─────────────────────────────────────────────────────────

function buildDayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

// ─── Column separator ─────────────────────────────────────────────────────────

function ColSep() {
  return (
    <View
      style={{
        width: 0.5,
        alignSelf: 'stretch',
        backgroundColor: Colors.c4,
        marginHorizontal: 4,
      }}
    />
  );
}

// ─── Macro column ─────────────────────────────────────────────────────────────

function MacroCol({
  label,
  value,
  unit,
  progress,
}: {
  label: string;
  value: number;
  unit: string;
  progress: number;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Text
        style={{
          fontSize: 11,
          color: Colors.t4,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: Colors.t1,
            fontVariant: ['tabular-nums'],
          }}
        >
          {Math.round(value)}
        </Text>
        <Text style={{ fontSize: 10, color: Colors.t3 }}>{unit}</Text>
      </View>
      <View style={{ width: '100%', marginTop: 3, height: 2, backgroundColor: Colors.c3, borderRadius: 1 }}>
        <View style={{ width: `${Math.min(progress, 1) * 100}%`, height: 2, backgroundColor: Colors.t2, borderRadius: 1 }} />
      </View>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { context } = useDailyStore();
  const { data: streakData } = useStreak(user?.id);

  // v3 data — primary source
  const { log, meals: v3Meals, isLoading: isLoadingV3, refetch } = useTodayData();

  // Legacy fallback — scan_history
  const { data: legacyData, isRefetching: isRefetchingLegacy } = useDailyNutrition();

  // Determine whether we have v3 meal data
  const hasV3Meals = v3Meals.length > 0;

  // Targets from profile (v3 schema) or safe defaults
  const caloriesGoal  = profile?.calories_target  ?? (legacyData?.goals?.calories ?? 2100);
  const proteinGoal   = profile?.protein_target   ?? (legacyData?.goals as any)?.protein  ?? 150;
  const hydrationGoal = profile?.hydration_target ?? 2000;

  // Carbs / fat goals: v3 doesn't store these on profile — fall back to legacy or defaults
  const carbsGoal = (legacyData?.goals as any)?.carbs_g ?? (legacyData?.goals as any)?.carbs ?? 240;
  const fatGoal   = (legacyData?.goals as any)?.fat_g   ?? (legacyData?.goals as any)?.fat   ?? 70;

  // Nutrition totals: prefer v3 log, fall back to legacy totals
  const kcalCurrent  = log?.calories_consumed ?? legacyData?.totals?.calories ?? 0;
  const protCurrent  = log?.protein_consumed  ?? legacyData?.totals?.protein  ?? 0;
  const carbsCurrent = log?.carbs_consumed    ?? legacyData?.totals?.carbs    ?? 0;
  const fatCurrent   = log?.fat_consumed      ?? legacyData?.totals?.fat      ?? 0;
  const waterMl      = log?.hydration_ml ?? 0;

  const kcalPercent  = caloriesGoal  > 0 ? kcalCurrent  / caloriesGoal  : 0;
  const protPercent  = proteinGoal   > 0 ? protCurrent   / proteinGoal   : 0;
  const carbsPercent = carbsGoal     > 0 ? carbsCurrent  / carbsGoal     : 0;
  const fatPercent   = fatGoal       > 0 ? fatCurrent    / fatGoal       : 0;

  // PRAXIS Score — real calculation via service
  const scoreResult = useMemo(() => {
    return calculateScore({
      calories:       { consumed: kcalCurrent,  target: caloriesGoal  },
      protein:        { consumed: protCurrent,   target: proteinGoal   },
      hydration:      { consumed: waterMl,       target: hydrationGoal },
      consistency:    0.1, // conservative default until streak tracking is wired
      micronutrients: 0.6,
      context,
    });
  }, [kcalCurrent, caloriesGoal, protCurrent, proteinGoal, waterMl, hydrationGoal, context]);

  // Persist score + basic totals whenever the score changes
  useEffect(() => {
    if (!user || !scoreResult) return;
    upsertDailyLog(user.id, {
      score:             scoreResult.total,
      context,
      calories_consumed: kcalCurrent,
      protein_consumed:  protCurrent,
      hydration_ml:      waterMl,
    }).catch(() => {/* silent — non-critical write */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreResult?.total, context]);

  const scoreValue = scoreResult.total;
  const scoreLabel = scoreResult.label;

  const copy = CONTEXT_COPY[context];

  // Timeline meals — prefer v3, fall back to legacy scan_history slots
  const timelineMeals: TimelineMeal[] = useMemo(() => {
    if (hasV3Meals) {
      return v3Meals.map((m) => ({
        id:          m.id,
        time:        new Date(m.logged_at ?? new Date()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        name:        m.meal_type === 'breakfast' ? 'Café da manhã'
                   : m.meal_type === 'lunch'     ? 'Almoço'
                   : m.meal_type === 'dinner'    ? 'Jantar'
                   : 'Lanche',
        description: m.name,
        calories:    m.calories ?? 0,
        protein:     m.protein ?? 0,
        carbs:       m.carbs ?? 0,
        status:      'active' as const,
      }));
    }

    // Legacy: map scan_history items to timeline slots
    const legacyMeals = legacyData?.meals ?? [];
    const mealSlots: TimelineMeal[] = [
      { id: 'breakfast', time: '07:30', name: 'Café da manhã', calories: 0, protein: 0, carbs: 0, status: 'empty' },
      { id: 'lunch',     time: '12:00', name: 'Almoço',        calories: 0, protein: 0, carbs: 0, status: 'empty' },
      { id: 'snack',     time: '15:30', name: 'Lanche',        calories: 0, protein: 0, carbs: 0, status: 'empty' },
      { id: 'dinner',    time: '19:30', name: 'Jantar',        calories: 0, protein: 0, carbs: 0, status: 'empty' },
    ];
    return mealSlots.map((slot) => {
      const real = legacyMeals.find((m) => m.meal_type === slot.id);
      if (real) {
        return {
          id:       real.id,
          time:     slot.time,
          name:     real.name ?? slot.name,
          calories: real.calories ?? 0,
          protein:  real.protein ?? 0,
          carbs:    real.carbs ?? 0,
          status:   'active' as const,
        };
      }
      return slot;
    });
  }, [hasV3Meals, v3Meals, legacyData]);

  const dayLabel      = buildDayLabel();
  const kcalRemaining = Math.max(0, Math.round(caloriesGoal - kcalCurrent));
  const firstName     = profile?.name?.split(' ')[0] ?? 'Você';

  // Combine refresh states: treat v3 loading + legacy refetching together
  const isRefreshing = isLoadingV3 || isRefetchingLegacy;

  const { consumed_ml: hydraMl, addWater } = useHydrationStore();
  const hydraFilled = Math.min(Math.floor(hydraMl / 250), 8);

  return (
    <View style={{ flex: 1, backgroundColor: SpecColors.BG }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* HEADER — fixo, fora do scroll */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: SpecColors.B1 }}>
        {/* Row 1: logo + perfil */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Svg width={14} height={12} viewBox="0 0 40 35">
              <Polygon points="20,2 2,33 38,33" fill="none" stroke={SpecColors.WH} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: SpecColors.WH, letterSpacing: 3 }}>PRAXIS</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={6}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, borderColor: SpecColors.B1, backgroundColor: SpecColors.C2, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: SpecColors.WH }}>
              {profile?.name ? profile.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() : '⊙'}
            </Text>
          </Pressable>
        </View>
        {/* Row 2: data + streak badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: fonts.sansLight, fontSize: 11, color: SpecColors.W3, letterSpacing: 1 }}>
            {dayLabel.toUpperCase()}
          </Text>
          <View style={{ backgroundColor: SpecColors.AC, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.WH }}>🔥 {streakData?.streak ?? 0} DIAS</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={SpecColors.W3} />}
      >
        {/* CONTEXT SELECTOR */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <ContextSelector />
        </View>

        {/* CARD SALDO CALÓRICO */}
        <View style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: SpecColors.C1, borderWidth: 0.5, borderColor: SpecColors.B1, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.W3, letterSpacing: 2, marginBottom: 12 }}>SALDO CALÓRICO · HOJE</Text>

          {/* Número grande + ring */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View>
              <Text style={{ fontFamily: fonts.monoLight, fontSize: 48, color: SpecColors.WH, letterSpacing: -2, lineHeight: 52 }}>
                {kcalRemaining.toLocaleString('pt-BR')}
              </Text>
              <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.W3, letterSpacing: 2, marginTop: 2 }}>KCAL RESTANTES</Text>
            </View>
            <CalorieRing current={kcalCurrent} goal={caloriesGoal} size={60} color={SpecColors.AC} showLabel={false} />
          </View>

          {/* Grid META | CONS. | PROG. */}
          <View style={{ flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: SpecColors.B1 }}>
            {[
              { label: 'META', value: caloriesGoal.toLocaleString('pt-BR') },
              { label: 'CONS.', value: Math.round(kcalCurrent).toLocaleString('pt-BR') },
              { label: 'PROG.', value: `${Math.round(Math.min(kcalCurrent / (caloriesGoal || 1), 1) * 100)}%` },
            ].map((col) => (
              <View key={col.label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.monoRegular, fontSize: 16, color: SpecColors.WH }}>{col.value}</Text>
                <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.W3, letterSpacing: 1, marginTop: 2 }}>{col.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CARD REFEIÇÕES */}
        <View style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: SpecColors.C1, borderWidth: 0.5, borderColor: SpecColors.B1, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.W3, letterSpacing: 2, marginBottom: 12 }}>REFEIÇÕES DE HOJE</Text>
          <MealTimeline meals={timelineMeals} />
          <Pressable
            onPress={() => router.push('/log')}
            style={{ marginTop: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: SpecColors.B1, borderRadius: 6, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: SpecColors.W2, letterSpacing: 2 }}>REGISTRAR NOVAMENTE</Text>
          </Pressable>
        </View>

        {/* SEÇÃO HIDRATAÇÃO — 8 círculos 24px */}
        <View style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: SpecColors.C1, borderWidth: 0.5, borderColor: SpecColors.B1, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.W3, letterSpacing: 2, marginBottom: 12 }}>HIDRATAÇÃO</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Pressable
                key={i}
                hitSlop={6}
                onPress={() => i >= hydraFilled && addWater(250, user?.id)}
                style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: i < hydraFilled ? SpecColors.AC : SpecColors.B1,
                }}
              />
            ))}
          </View>
          <Text style={{ fontFamily: fonts.sansLight, fontSize: 10, color: SpecColors.W3, marginTop: 8 }}>
            {hydraMl}ml · meta 2.000ml
          </Text>
        </View>

        {/* SUGESTÃO DO COACH */}
        <View style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: SpecColors.C1, borderWidth: 0.5, borderColor: SpecColors.B1, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontFamily: fonts.sansRegular, fontSize: 10, color: SpecColors.W3, letterSpacing: 2, marginBottom: 8 }}>SUGESTÃO DO COACH</Text>
          <Text style={{ fontFamily: fonts.sansLight, fontSize: 14, fontStyle: 'italic', color: SpecColors.WH, lineHeight: 22 }}>{copy.sug}</Text>
          <Text style={{ fontFamily: fonts.monoRegular, fontSize: 12, color: SpecColors.W3, marginTop: 4 }}>{copy.sub}</Text>
        </View>
      </ScrollView>

      {/* BOTÃO REGISTRAR — fixo no bottom */}
      <View style={{ position: 'absolute', bottom: insets.bottom + 72, left: 20, right: 20 }}>
        <MetallicButton label="📷 REGISTRAR REFEIÇÃO" variant="primary" onPress={() => router.push('/log')} />
      </View>
    </View>
  );
}
