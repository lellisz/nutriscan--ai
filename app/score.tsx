import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Circle, Path, Text as SvgText, Line } from 'react-native-svg';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedProps, useSharedValue, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors, fonts, fontSizes } from '@/constants/design';
import { Colors as SpecColors } from "@/constants/Colors";
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useTodayData } from '@/hooks/useTodayData';
import { useAuthStore } from '@/stores/authStore';
import { calculateScore } from '@/services/score';
import { getLast7DaysLogs } from '@/services/daily';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── ScoreRing ────────────────────────────────────────────────────────────────

const RING_SIZE       = 134;
const RING_CX         = 67;
const RING_CY         = 67;
const RING_R          = 57;
const RING_SW         = 10;
const GUIDE_R         = 45;
const CIRCUMFERENCE   = 2 * Math.PI * RING_R;

function ScoreRing({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value / 100, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Animated.View entering={FadeInDown.duration(560).springify()} style={styles.ringWrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 134 134">
        <Circle
          cx={RING_CX} cy={RING_CY} r={GUIDE_R}
          stroke={SpecColors.C2} strokeWidth={0.5} fill="none"
          strokeDasharray="1.5 10"
        />
        <Circle
          cx={RING_CX} cy={RING_CY} r={RING_R}
          stroke={SpecColors.C3} strokeWidth={RING_SW} fill="none"
        />
        <AnimatedCircle
          cx={RING_CX} cy={RING_CY} r={RING_R}
          stroke={SpecColors.WH} strokeWidth={RING_SW} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
        />
      </Svg>
      <View style={styles.ringCenter} pointerEvents="box-none">
        <Pressable
          onPress={onPress}
          hitSlop={8}
          style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Abrir explicação do score"
        >
          <Text style={styles.ringScore}>{value}</Text>
        </Pressable>
        <Text style={styles.ringLabel}>{label.toUpperCase()}</Text>
      </View>
    </Animated.View>
  );
}

// ─── TrendChart ───────────────────────────────────────────────────────────────

function TrendChart({ data, days }: { data: number[]; days: string[] }) {
  const { width } = useWindowDimensions();
  const chartWidth  = width - 24 * 2 - 18 * 2;
  const chartHeight = 56;
  const padL = 24;
  const padR = 8;
  const padT = 6;
  const padB = 20;

  const innerW = chartWidth - padL - padR;
  const innerH = chartHeight - padT - padB;
  const minY   = 0;
  const maxY   = 100;

  const safeData = data.length > 0 ? data : [0];
  const points   = safeData.map((v, i) => ({
    x: padL + (i / Math.max(safeData.length - 1, 1)) * innerW,
    y: padT + (1 - (v - minY) / (maxY - minY)) * innerH,
  }));

  function buildPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX  = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const pathD = buildPath(points);
  const last  = points[points.length - 1];

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {[0, 50, 100].map((v) => {
        const yPos = padT + (1 - (v - minY) / (maxY - minY)) * innerH;
        return (
          <React.Fragment key={v}>
            <Line
              x1={padL} y1={yPos} x2={padL + innerW} y2={yPos}
              stroke={SpecColors.C3} strokeWidth={0.5}
            />
            <SvgText
              x={padL - 4} y={yPos + 3.5}
              fontSize={10} fill={SpecColors.W4}
              textAnchor="end"
            >{v}</SvgText>
          </React.Fragment>
        );
      })}
      {points.length >= 2 && (
        <Path d={pathD} stroke={SpecColors.WH} strokeWidth={1.5} fill="none" />
      )}
      <Circle cx={last.x} cy={last.y} r={4} fill={SpecColors.WH} />
      {points.map((pt, i) => (
        <SvgText
          key={i} x={pt.x} y={chartHeight - 4}
          fontSize={10} fill={SpecColors.W4} textAnchor="middle"
        >{days[i] ?? ''}</SvgText>
      ))}
    </Svg>
  );
}

// ─── BreakdownCard ────────────────────────────────────────────────────────────

function BreakdownCard({ name, score, max }: { name: string; score: number; max: number }) {
  return (
    <Card style={styles.breakdownCard}>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownName}>{name}</Text>
        <View style={styles.breakdownScoreRow}>
          <Text style={styles.breakdownScore}>{score}</Text>
          <Text style={styles.breakdownMax}>/{max}</Text>
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <ProgressBar value={max > 0 ? score / max : 0} />
      </View>
    </Card>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
      hitSlop={6}
    >
      <Text style={styles.backIcon}>‹</Text>
    </Pressable>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

function getDayLetter(dateStr: string): string {
  return DAY_LETTERS[new Date(dateStr + 'T12:00:00').getDay()];
}

type Components = ReturnType<typeof calculateScore>['components'];

function buildTipText(
  components: Components,
  caloriesConsumed: number,
  caloriesTarget: number,
  hydrationConsumed: number,
  hydrationTarget: number,
): string {
  const ratios: Record<string, number> = {
    nutrition:   components.nutrition      / 35,
    protein:     components.protein        / 25,
    hydration:   components.hydration      / 20,
    consistency: components.consistency    / 10,
    micronutrients: components.micronutrients / 10,
  };

  const weakest = Object.entries(ratios).reduce((a, b) => (a[1] < b[1] ? a : b))[0];

  if (weakest === 'hydration') {
    const remaining = Math.max(0, hydrationTarget - hydrationConsumed);
    const cups = Math.ceil(remaining / 200);
    return cups > 0
      ? `Beba mais ${cups} copo${cups > 1 ? 's' : ''} d'água antes das 18h.\nSeu score pode subir até ${Math.round(cups * 1.5)} pontos.`
      : 'Hidratação excelente! Mantenha esse ritmo amanhã.';
  }

  if (weakest === 'protein') {
    return 'Proteína abaixo do ideal.\nAdicione frango, ovo, atum ou whey na próxima refeição.';
  }

  if (weakest === 'nutrition') {
    const remaining = Math.max(0, caloriesTarget - caloriesConsumed);
    return remaining > 200
      ? `Ainda restam ${Math.round(remaining)} kcal disponíveis.\nUma refeição leve equilibra seu score.`
      : 'Meta calórica atingida.\nFoco em qualidade nutricional amanhã.';
  }

  return 'Consistência é a chave!\nMantenha o padrão de hoje amanhã para subir no ranking semanal.';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScoreScreen() {
  const { log }         = useTodayData();
  const { profile, user } = useAuthStore();
  const [showExplanation, setShowExplanation] = useState(false);

  const { data: weekLogs } = useQuery({
    queryKey: ['weekly-score', user?.id],
    queryFn: () => getLast7DaysLogs(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  const caloriesTarget  = profile?.calories_target  ?? 2100;
  const proteinTarget   = profile?.protein_target   ?? 150;
  const hydrationTarget = profile?.hydration_target ?? 2500;

  const scoreResult = calculateScore({
    calories:       { consumed: log?.calories_consumed ?? 0, target: caloriesTarget },
    protein:        { consumed: log?.protein_consumed  ?? 0, target: proteinTarget },
    hydration:      { consumed: log?.hydration_ml      ?? 0, target: hydrationTarget },
    consistency:    0.7,
    micronutrients: 0.5,
    context:        log?.context ?? 'normal',
  });

  const BREAKDOWN = [
    { name: 'Nutrição',        score: Math.round(scoreResult.components.nutrition),         max: 35 },
    { name: 'Proteína',        score: Math.round(scoreResult.components.protein),           max: 25 },
    { name: 'Hidratação',      score: Math.round(scoreResult.components.hydration),         max: 20 },
    { name: 'Consistência',    score: Math.round(scoreResult.components.consistency),       max: 10 },
    { name: 'Micronutrientes', score: Math.round(scoreResult.components.micronutrients),    max: 10 },
  ];

  // Trend: últimos 7 dias, mais antigo primeiro
  const sortedLogs   = weekLogs ? [...weekLogs].reverse() : [];
  const trendData    = sortedLogs.length > 0
    ? sortedLogs.map((l) => l.score ?? 0)
    : [0, 0, 0, 0, 0, 0, scoreResult.total];
  const trendDays    = sortedLogs.length > 0
    ? sortedLogs.map((l) => getDayLetter(l.date))
    : ['D', 'S', 'T', 'Q', 'Q', 'S', 'D'];

  const tipText = buildTipText(
    scoreResult.components,
    log?.calories_consumed ?? 0,
    caloriesTarget,
    log?.hydration_ml      ?? 0,
    hydrationTarget,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <BackButton />

        <ScoreRing
          value={scoreResult.total}
          label={scoreResult.label}
          onPress={() => setShowExplanation((current) => !current)}
        />

        <Text style={styles.subtitle}>Praxis score · hoje</Text>

        {showExplanation && (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(180)}>
            <Card highlight style={styles.explanationCard}>
              <Text style={styles.explanationText}>
                Score mínimo 12 — nunca zero. Considera seu contexto de vida, hidratação, proteína e jejum.
              </Text>
            </Card>
          </Animated.View>
        )}

        <SectionLabel style={styles.sectionLabel}>Breakdown</SectionLabel>

        {BREAKDOWN.map((item) => (
          <BreakdownCard key={item.name} {...item} />
        ))}

        <Card highlight style={styles.tipCard}>
          <SectionLabel style={styles.cardSectionLabel}>
            Como melhorar amanhã
          </SectionLabel>
          <Text style={styles.tipText}>{tipText}</Text>
        </Card>

        <Card style={styles.trendCard}>
          <SectionLabel style={styles.cardSectionLabel}>
            Tendência da semana
          </SectionLabel>
          <TrendChart data={trendData} days={trendDays} />
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: SpecColors.BG },
  scroll: { paddingTop: 16 },

  backBtn: {
    marginLeft: 22,
    marginBottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SpecColors.C2,
    borderWidth: 0.5,
    borderColor: SpecColors.B1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: SpecColors.W2, lineHeight: 28, marginTop: -1 },

  ringWrapper: {
    alignSelf: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonPressed: {
    opacity: 0.7,
  },
  ringScore: {
    fontFamily: fonts.monoLight,
    fontSize: 33,
    color: SpecColors.WH,
    fontVariant: ['tabular-nums'],
    lineHeight: 38,
  },
  ringLabel: {
    fontFamily: fonts.sansLight,
    fontSize: 10,
    color: SpecColors.W3,
    letterSpacing: 0.09 * 10,
    textTransform: 'uppercase',
  },

  subtitle: {
    fontSize: 11,
    color: SpecColors.W3,
    letterSpacing: 0.06 * 11,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  explanationCard: {
    marginTop: 6,
  },
  explanationText: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes.sm,
    color: SpecColors.W3,
    lineHeight: 20,
  },

  sectionLabel:     { marginHorizontal: 22, marginTop: 20, marginBottom: 10 },
  cardSectionLabel: { marginBottom: 10 },

  breakdownCard: { marginBottom: 7 },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownName:      { fontSize: 13, color: Colors.t1 },
  breakdownScoreRow:  { flexDirection: 'row', alignItems: 'baseline' },
  breakdownScore:     { fontSize: 14, fontWeight: '700', color: SpecColors.WH, fontVariant: ['tabular-nums'] },
  breakdownMax:       { fontSize: 11, color: Colors.t3 },

  tipCard:   { marginTop: 6 },
  tipText:   { fontSize: 13, color: SpecColors.W2, lineHeight: 20 },

  trendCard: { marginTop: 6 },
});
