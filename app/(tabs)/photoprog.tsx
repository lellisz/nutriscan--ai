import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, fonts } from '@/constants/design';
import { Colors as SpecColors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPARE_HEIGHT = 320;

// Token aliases from spec
const BG = '#07070D';
const C1 = '#0D0D17';
const WH = '#EBE4D2';
const W3 = '#8A8070';
const W4 = '#4A4860';
const AC = '#6B5FE4';
const B1 = '#2A2840';
const CO = '#E8593C';
const OK = '#2D7A4F';

// Mock timeline data
const TIMELINE_DATA = [
  { month: 'JAN 2025', weight: '76 kg', delta: '−2.1 kg', isPositive: true },
  { month: 'DEZ 2024', weight: '78.1 kg', delta: '−1.4 kg', isPositive: true },
  { month: 'NOV 2024', weight: '79.5 kg', delta: '+0.8 kg', isPositive: false },
];

// ─── Placeholder de foto (até integrar com câmera/galeria) ───────────────────

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoPlaceholderText}>{label}</Text>
    </View>
  );
}

// ─── Comparação antes/depois com divisor deslizante ──────────────────────────

function PhotoComparison({ splitPct }: { splitPct: number }) {
  const splitX = (splitPct / 100) * SCREEN_WIDTH;

  return (
    <View style={styles.compareContainer}>
      {/* Foto "depois" — full width por baixo */}
      <View style={StyleSheet.absoluteFill}>
        <PhotoPlaceholder label="Depois" />
      </View>

      {/* Foto "antes" — recortada pela esquerda via overflow:hidden */}
      <View style={[styles.beforeClip, { width: splitX }]}>
        <View style={{ width: SCREEN_WIDTH }}>
          <PhotoPlaceholder label="Antes" />
        </View>
      </View>

      {/* Labels ANTES / DEPOIS */}
      <Text style={styles.labelAntes}>ANTES</Text>
      <Text style={styles.labelDepois}>DEPOIS</Text>

      {/* Peso overlaid bottom-left */}
      <View style={styles.weightOverlay}>
        <Text style={styles.weightValue}>76</Text>
        <Text style={styles.weightUnit}>kg · JAN 2025</Text>
      </View>

      {/* Linha divisora */}
      <View style={[styles.divider, { left: splitX - 1 }]} />

      {/* Handle circular */}
      <View style={[styles.dividerHandle, { left: splitX - 16 }]}>
        <Text style={styles.dividerHandleText}>⟷</Text>
      </View>
    </View>
  );
}

// ─── Card de métricas ─────────────────────────────────────────────────────────

function MetricCol({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <View style={styles.metricCol}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRow}>
        <Text style={styles.metricBefore}>{before}</Text>
        <Text style={styles.metricArrow}>→</Text>
        <Text style={styles.metricAfter}>{after}</Text>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function PhotoProgressScreen() {
  const insets = useSafeAreaInsets();
  const [splitPct, setSplitPct] = useState(50);

  const onSliderChange = useCallback((value: number) => {
    setSplitPct(value);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>PRAXIS · EVOLUÇÃO</Text>
        <Text style={styles.headerTitle}>FOTOS DE PROGRESSO</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Comparação de fotos */}
        <PhotoComparison splitPct={splitPct} />

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={95}
            value={splitPct}
            onValueChange={onSliderChange}
            minimumTrackTintColor={AC}
            maximumTrackTintColor={W4}
            thumbTintColor={WH}
          />
        </View>

        {/* Linha do tempo */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionLabel}>LINHA DO TEMPO</Text>
          {TIMELINE_DATA.map((entry, idx) => (
            <View
              key={idx}
              style={[
                styles.timelineRow,
                idx < TIMELINE_DATA.length - 1 && styles.timelineRowBorder,
              ]}
            >
              <Text style={styles.timelineMonth}>{entry.month}</Text>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineWeight}>{entry.weight}</Text>
                <Text
                  style={[
                    styles.timelineDelta,
                    { color: entry.isPositive ? OK : CO },
                  ]}
                >
                  {entry.delta}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Evolução card */}
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <View style={styles.metricsGrid}>
              <MetricCol label="PESO" before="82 kg" after="76 kg" />
              <View style={styles.metricSep} />
              <MetricCol label="GORDURA" before="22%" after="18%" />
              <View style={styles.metricSep} />
              <MetricCol label="MÚSCULO" before="35 kg" after="39 kg" />
            </View>
          </View>
        </View>

        {/* Footer row */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerLabel}>PROGRESSO TOTAL</Text>
            <Text style={styles.footerValue}>−2.7 kg em 60 dias</Text>
          </View>
          <Pressable style={styles.addPhotoBtn}>
            <Text style={styles.addPhotoBtnText}>+ FOTO</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  headerEyebrow: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W3,
  },
  headerTitle: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    letterSpacing: 6,
    color: WH,
    marginTop: 4,
  },
  compareContainer: {
    width: SCREEN_WIDTH,
    height: COMPARE_HEIGHT,
    overflow: 'hidden',
    backgroundColor: C1,
  },
  beforeClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: COMPARE_HEIGHT,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: SCREEN_WIDTH,
    height: COMPARE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C1,
  },
  photoPlaceholderText: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W4,
  },
  labelAntes: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W3,
  },
  labelDepois: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W3,
  },
  weightOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 24,
    color: CO,
  },
  weightUnit: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W3,
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: WH,
    opacity: 0.6,
  },
  dividerHandle: {
    position: 'absolute',
    top: COMPARE_HEIGHT / 2 - 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerHandleText: {
    fontSize: 12,
    color: BG,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  slider: {
    width: SCREEN_WIDTH - 40,
    height: 32,
  },
  timelineSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W3,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timelineRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: B1,
  },
  timelineMonth: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 2,
    color: W3,
  },
  timelineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineWeight: {
    fontFamily: fonts.monoRegular,
    fontSize: 14,
    color: WH,
  },
  timelineDelta: {
    fontFamily: fonts.monoRegular,
    fontSize: 11,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  card: {
    backgroundColor: C1,
    borderWidth: 0.5,
    borderColor: B1,
    borderRadius: 12,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 9,
    letterSpacing: 2,
    color: W3,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricBefore: {
    fontFamily: fonts.monoRegular,
    fontSize: 12,
    color: W3,
  },
  metricArrow: {
    fontFamily: fonts.monoRegular,
    fontSize: 10,
    color: W4,
  },
  metricAfter: {
    fontFamily: fonts.monoRegular,
    fontSize: 12,
    color: WH,
  },
  metricSep: {
    width: 0.5,
    alignSelf: 'stretch',
    backgroundColor: B1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  footerLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: W3,
  },
  footerValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 16,
    color: WH,
    marginTop: 2,
  },
  addPhotoBtn: {
    borderWidth: 0.5,
    borderColor: B1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addPhotoBtnText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 2,
    color: W3,
  },
});
