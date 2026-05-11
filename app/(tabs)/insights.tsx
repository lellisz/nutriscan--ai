import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/constants/design';
import { Colors as SpecColors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type WeightPeriod = '7d' | '30d' | '90d';

interface WeightLog {
  id: string;
  weight_kg: number;
  logged_at: string;
}

const PERIOD_DAYS: Record<WeightPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };

const PERIOD_LABELS: { key: WeightPeriod; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
];

// ─── HOOK: WEIGHT LOGS ────────────────────────────────────────────────────────

function useWeightLogs(userId: string | undefined, period: WeightPeriod) {
  return useQuery<WeightLog[]>({
    queryKey: ['weight-logs', userId, period],
    queryFn: async () => {
      if (!userId) throw new Error('Não autenticado');
      const days = PERIOD_DAYS[period];
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from('weight_logs')
        .select('id, weight_kg, logged_at')
        .eq('user_id', userId)
        .gte('logged_at', since.toISOString())
        .order('logged_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as WeightLog[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── GRÁFICO DE LINHA ─────────────────────────────────────────────────────────

const CHART_W = 280;
const CHART_H = 110;

function WeightLineChart({ logs, targetWeight }: { logs: WeightLog[]; targetWeight: number | null }) {
  if (logs.length < 2) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Text style={{ fontFamily: fonts.sansLight, fontSize: 13, color: SpecColors.W3 }}>
          {logs.length === 0 ? 'Nenhum registro ainda' : 'Registre mais medições para ver o gráfico'}
        </Text>
      </View>
    );
  }

  const weights = logs.map((l) => l.weight_kg);
  const minW = Math.min(...weights, targetWeight ?? Infinity);
  const maxW = Math.max(...weights, targetWeight ?? -Infinity);
  const range = maxW - minW || 1;

  const PADDING = 6;
  const usableW = CHART_W - PADDING * 2;
  const usableH = CHART_H - PADDING * 2 - 20; // extra space for date labels

  const points = logs.map((l, i) => {
    const x = PADDING + (i / (logs.length - 1)) * usableW;
    const y = PADDING + (1 - (l.weight_kg - minW) / range) * usableH;
    return { x, y, w: l.weight_kg };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const lastPt = points[points.length - 1];

  // First and last date labels
  const firstDate = new Date(logs[0].logged_at);
  const lastDate = new Date(logs[logs.length - 1].logged_at);
  const formatDate = (d: Date) =>
    `${d.getDate()} ${d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}`;

  // Goal line y position
  const goalY = targetWeight !== null
    ? PADDING + (1 - (targetWeight - minW) / range) * usableH
    : null;

  return (
    <View>
      <Svg width="100%" height={CHART_H + 20} viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`}>
        {/* Goal line (dashed) */}
        {goalY !== null && (
          <Line
            x1={PADDING}
            y1={goalY}
            x2={CHART_W - PADDING}
            y2={goalY}
            stroke={SpecColors.W3}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        )}

        {/* Main line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={SpecColors.AC}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={SpecColors.AC} />
        ))}

        {/* Last point larger dot */}
        <Circle cx={lastPt.x} cy={lastPt.y} r={5} fill={SpecColors.AC} />

        {/* First date label */}
        <SvgText
          x={PADDING}
          y={CHART_H + 12}
          fontSize={10}
          fontFamily={fonts.sansRegular}
          fill={SpecColors.W3}
          textAnchor="start"
        >
          {formatDate(firstDate)}
        </SvgText>

        {/* Last date label */}
        <SvgText
          x={CHART_W - PADDING}
          y={CHART_H + 12}
          fontSize={10}
          fontFamily={fonts.sansRegular}
          fill={SpecColors.W3}
          textAnchor="end"
        >
          {formatDate(lastDate)}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── BMI BAR ──────────────────────────────────────────────────────────────────

function BmiBar({ bmi, bmiPct }: { bmi: number | null; bmiPct: number }) {
  const zones = [
    { label: 'ABAIXO', color: SpecColors.W4, flex: 2.5 },
    { label: 'NORMAL', color: SpecColors.OK, flex: 6.5 },
    { label: 'SOBREP.', color: SpecColors.WRN, flex: 5 },
    { label: 'OBESO', color: SpecColors.ERR, flex: 2 },
  ];

  return (
    <View>
      <View style={styles.bmiBarContainer}>
        {zones.map((z, i) => (
          <View
            key={z.label}
            style={[
              styles.bmiZone,
              {
                flex: z.flex,
                backgroundColor: z.color,
                borderTopLeftRadius: i === 0 ? 4 : 0,
                borderBottomLeftRadius: i === 0 ? 4 : 0,
                borderTopRightRadius: i === zones.length - 1 ? 4 : 0,
                borderBottomRightRadius: i === zones.length - 1 ? 4 : 0,
              },
            ]}
          />
        ))}
        {/* Marker */}
        {bmi !== null && (
          <View style={[styles.bmiMarker, { left: `${bmiPct * 100}%` }]}>
            <View style={styles.bmiTriangle} />
          </View>
        )}
      </View>
      {/* Zone labels */}
      <View style={styles.bmiLabelsRow}>
        {zones.map((z) => (
          <Text key={z.label} style={[styles.bmiZoneLabel, { flex: z.flex }]}>
            {z.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const qc = useQueryClient();

  const [period, setPeriod] = useState<WeightPeriod>('30d');
  const [showInput, setShowInput] = useState(false);
  const [weightVal, setWeightVal] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: logs = [], isLoading } = useWeightLogs(user?.id, period);

  // Current weight (latest log)
  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight_kg : null;

  // BMI calculation
  const bmi = profile?.weight_kg && profile?.height_cm
    ? profile.weight_kg / Math.pow(profile.height_cm / 100, 2)
    : null;
  const bmiLabel = bmi === null ? null
    : bmi < 18.5 ? 'ABAIXO' : bmi < 25 ? 'NORMAL' : bmi < 30 ? 'SOBREP.' : 'OBESO';
  const bmiPct = bmi !== null ? Math.min(Math.max((bmi - 16) / (32 - 16), 0), 1) : 0.4;

  // Last 5 weight logs (most recent first)
  const recentLogs = useMemo(() => {
    return [...logs].reverse().slice(0, 5);
  }, [logs]);

  // Handle save weight
  async function handleSave() {
    const parsed = parseFloat(weightVal.replace(',', '.'));
    if (!user?.id || isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    const { error } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, weight_kg: parsed, logged_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar a medição.');
      return;
    }
    qc.invalidateQueries({ queryKey: ['weight-logs'] });
    setShowInput(false);
    setWeightVal('');
  }

  // Target weight from profile
  const targetWeight = profile?.target_weight_kg ?? null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
      >
        {/* HEADER */}
        <View style={styles.headerSection}>
          <Text style={styles.headerLabel}>PRAXIS · EVOLUCAO</Text>
          <Text style={styles.headerTitle}>EVOLUCAO DE PESO</Text>
          <View style={styles.currentWeightRow}>
            {currentWeight !== null ? (
              <>
                <Text style={styles.currentWeightValue}>{currentWeight.toFixed(1)}</Text>
                <Text style={styles.currentWeightUnit}> KG ATUAL</Text>
              </>
            ) : (
              <Text style={styles.currentWeightPlaceholder}>--</Text>
            )}
          </View>
        </View>

        {/* CHART CARD */}
        <View style={styles.card}>
          {isLoading ? (
            <Text style={styles.loadingText}>Carregando...</Text>
          ) : (
            <WeightLineChart logs={logs} targetWeight={targetWeight} />
          )}

          {/* Period selector */}
          <View style={styles.periodRow}>
            {PERIOD_LABELS.map(({ key, label }) => {
              const isActive = period === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setPeriod(key)}
                  style={[
                    styles.periodPill,
                    isActive ? styles.periodPillActive : styles.periodPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      { color: isActive ? SpecColors.WH : SpecColors.W3 },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Weight input */}
          {!showInput ? (
            <Pressable onPress={() => setShowInput(true)} style={styles.addWeightBtn}>
              <Text style={styles.addWeightBtnText}>+ REGISTRAR PESO</Text>
            </Pressable>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.weightInput}
                keyboardType="decimal-pad"
                placeholder="75.5"
                placeholderTextColor={SpecColors.W4}
                value={weightVal}
                onChangeText={setWeightVal}
                autoFocus
              />
              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? '...' : 'SALVAR'}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowInput(false);
                  setWeightVal('');
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>x</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* REGISTROS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ULTIMAS PESAGENS</Text>
          {recentLogs.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum registro ainda</Text>
          ) : (
            recentLogs.map((l, idx) => {
              const date = new Date(l.logged_at)
                .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                .toUpperCase()
                .replace('.', '');

              // Calculate delta vs next (older) entry
              const nextLog = recentLogs[idx + 1];
              let delta: number | null = null;
              let deltaColor: string = SpecColors.W3;
              if (nextLog) {
                delta = l.weight_kg - nextLog.weight_kg;
                deltaColor = delta < 0 ? SpecColors.OK : delta > 0 ? SpecColors.ERR : SpecColors.W3;
              }

              return (
                <View
                  key={l.id}
                  style={[
                    styles.logRow,
                    idx < recentLogs.length - 1 && styles.logRowBorder,
                  ]}
                >
                  <Text style={styles.logDate}>{date}</Text>
                  <View style={styles.logRight}>
                    <Text style={styles.logWeight}>{l.weight_kg.toFixed(1)} kg</Text>
                    {delta !== null && (
                      <Text style={[styles.logDelta, { color: deltaColor }]}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* IMC CARD */}
        <View style={styles.card}>
          <View style={styles.imcHeader}>
            {bmi !== null ? (
              <>
                <Text style={styles.imcValue}>{bmi.toFixed(1)}</Text>
                <Text style={styles.imcLabel}> {bmiLabel}</Text>
              </>
            ) : (
              <Text style={styles.imcPlaceholder}>--</Text>
            )}
          </View>
          <BmiBar bmi={bmi} bmiPct={bmiPct} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpecColors.BG,
  },
  scroll: {
    paddingHorizontal: 22,
  },

  // Header
  headerSection: {
    marginBottom: 24,
  },
  headerLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: SpecColors.W3,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: fonts.serifLight,
    fontSize: 28,
    letterSpacing: 6,
    color: SpecColors.WH,
    marginBottom: 12,
  },
  currentWeightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentWeightValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 36,
    color: SpecColors.WH,
  },
  currentWeightUnit: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: SpecColors.W3,
    letterSpacing: 1,
  },
  currentWeightPlaceholder: {
    fontFamily: fonts.monoRegular,
    fontSize: 36,
    color: SpecColors.W4,
  },

  // Card
  card: {
    backgroundColor: SpecColors.C1,
    borderWidth: 1,
    borderColor: SpecColors.B1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: SpecColors.W3,
    marginBottom: 12,
  },

  loadingText: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: SpecColors.W4,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Period pills
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  periodPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  periodPillActive: {
    backgroundColor: SpecColors.C2,
    borderColor: SpecColors.B1,
  },
  periodPillInactive: {
    backgroundColor: 'transparent',
    borderColor: SpecColors.B1,
  },
  periodPillText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 1,
  },

  // Add weight button
  addWeightBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addWeightBtnText: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: SpecColors.W3,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    flex: 1,
    backgroundColor: SpecColors.C2,
    borderWidth: 1,
    borderColor: SpecColors.B1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: SpecColors.WH,
  },
  saveBtn: {
    backgroundColor: SpecColors.AC,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1,
    color: SpecColors.WH,
  },
  cancelBtn: {
    padding: 10,
  },
  cancelBtnText: {
    fontFamily: fonts.sansLight,
    fontSize: 14,
    color: SpecColors.W3,
  },

  // Log rows
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: SpecColors.B1,
  },
  logDate: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: SpecColors.W3,
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logWeight: {
    fontFamily: fonts.monoRegular,
    fontSize: 16,
    color: SpecColors.WH,
  },
  logDelta: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
  },
  emptyText: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: SpecColors.W4,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // IMC
  imcHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  imcValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 32,
    color: SpecColors.WH,
  },
  imcLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 1,
    color: SpecColors.AC,
  },
  imcPlaceholder: {
    fontFamily: fonts.monoRegular,
    fontSize: 32,
    color: SpecColors.W4,
  },

  // BMI bar
  bmiBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  bmiZone: {
    height: 8,
  },
  bmiMarker: {
    position: 'absolute',
    top: -6,
    transform: [{ translateX: -6 }],
  },
  bmiTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: SpecColors.WH,
  },
  bmiLabelsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  bmiZoneLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 8,
    color: SpecColors.W4,
    textAlign: 'center',
  },
});
