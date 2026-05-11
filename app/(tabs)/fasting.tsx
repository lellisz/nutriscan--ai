import React, { useState, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Colors, fonts } from '@/constants/design';
import { PressableScale } from '@/components/ui/PressableScale';
import { Card } from '@/components/ui/Card';
import { VLine } from '@/components/ui/VLine';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { FastingRing } from '@/components/ui/FastingRing';
import { useFastingTimer } from '@/hooks/useFastingTimer';
import { useFasting } from '@/hooks/useFasting';
import type { FastingSession } from '@/services/fasting';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Protocol = '12:12' | '16:8' | '18:6' | '24h';

const PROTOCOL_HOURS: Record<Protocol, number> = {
  '12:12': 12,
  '16:8': 16,
  '18:6': 18,
  '24h': 24,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function barColor(ratio: number): string {
  if (ratio === 0) return Colors.c3;
  if (ratio === 1) return Colors.t1;
  if (ratio >= 0.7) return Colors.t2;
  return Colors.t4;
}

/** Converte uma FastingSession encerrada num ratio [0,1] de conclusão. */
function sessionToRatio(session: FastingSession): number {
  if (!session.ended_at) return 0;
  const targetMs = PROTOCOL_HOURS[session.protocol] * 3600 * 1000;
  const elapsed = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
  return Math.min(elapsed / targetMs, 1);
}

/** Rótulo do dia da semana (inicial) a partir de uma ISO string. */
function dayLabel(isoString: string): string {
  const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  return labels[new Date(isoString).getDay()];
}

// ─── TELA ─────────────────────────────────────────────────────────────────────

export default function FastingScreen() {
  const [activeProtocol, setActiveProtocol] = useState<Protocol>('16:8');

  const { activeFasting, history, isLoading, startFasting, endFasting, isStarting, isEnding } =
    useFasting();

  const protocols: Protocol[] = ['12:12', '16:8', '18:6', '24h'];

  // Protocolo e startTime reais se houver sessão ativa, ou valores locais
  const timerProtocol: Protocol =
    (activeFasting?.protocol as Protocol) ?? activeProtocol;

  // Usa ref estável para o fallback, evitando recriação do interval a cada render
  const fallbackStartRef = useRef<Date>(new Date());
  const timerStart: Date = activeFasting
    ? new Date(activeFasting.started_at)
    : fallbackStartRef.current;

  const targetHours = PROTOCOL_HOURS[timerProtocol];
  const { progress, remainingFormatted } = useFastingTimer(targetHours, timerStart);

  const targetLabel = `restante de ${timerProtocol === '24h' ? '24h' : timerProtocol.split(':')[0] + 'h'}`;

  const windowStart = '22:00';
  const windowEnd = '14:00';
  const eatStart = '14:00';
  const eatEnd = '22:00';

  // Histograma: dados reais do banco, ou zeros como fallback
  const histogramData = useMemo(() => {
    if (history.length === 0) {
      // Placeholder de 7 dias vazios enquanto carrega ou sem histórico
      return Array.from({ length: 7 }, (_, i) => ({ label: '', ratio: 0 }));
    }
    return history.map((s) => ({
      label: dayLabel(s.started_at),
      ratio: sessionToRatio(s),
    }));
  }, [history]);

  async function handleStart() {
    try {
      await startFasting(activeProtocol);
    } catch (e) {
      console.error('Erro ao iniciar jejum:', e);
    }
  }

  async function handleEnd() {
    if (!activeFasting) return;
    try {
      await endFasting(activeFasting.id, progress >= 1);
    } catch (e) {
      console.error('Erro ao encerrar jejum:', e);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Topo ── */}
        <VLine />
        <Text style={styles.title}>Jejum</Text>
        <Text style={styles.subtitle}>Protocolo de jejum intermitente</Text>

        {/* ── Pills de protocolo ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
          style={styles.pillsScroll}
        >
          {protocols.map((p) => {
            const active = p === (activeFasting?.protocol ?? activeProtocol);
            return (
              <Pressable
                key={p}
                onPress={() => {
                  if (!activeFasting) setActiveProtocol(p);
                }}
                style={[
                  styles.pill,
                  active ? styles.pillActive : styles.pillInactive,
                ]}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── FastingRing ── */}
        <View style={styles.ringContainer}>
          <FastingRing
            progress={activeFasting ? progress : 0}
            remainingFormatted={activeFasting ? remainingFormatted : '--:--:--'}
            targetLabel={targetLabel}
          />
        </View>

        {/* ── Card: Janelas de horário ── */}
        <Card>
          <View style={styles.windowRow}>
            <View style={styles.windowItem}>
              <Text style={styles.windowTime}>{windowStart} → {windowEnd}</Text>
              <Text style={styles.windowLabel}>Jejum</Text>
            </View>
            <View style={styles.windowDivider} />
            <View style={styles.windowItem}>
              <Text style={styles.windowTime}>{eatStart} → {eatEnd}</Text>
              <Text style={styles.windowLabel}>Comer</Text>
            </View>
          </View>
        </Card>

        {/* ── Card: Benefícios ativos ── */}
        <Card>
          <SectionLabel>Benefícios Ativos</SectionLabel>
          <Text style={styles.benefitPrimary}>
            {'→ Queima de gordura ativa desde 04:00'}
          </Text>
          <Text style={styles.benefitSecondary}>
            {'· Autofagia celular — início em 2h'}
          </Text>
          <Text style={[styles.benefitSecondary, { marginBottom: 0 }]}>
            {'· Cetose leve — gradual'}
          </Text>
        </Card>

        {/* ── Histograma 7 dias ── */}
        <SectionLabel style={styles.historyLabel}>Histórico 7 dias</SectionLabel>
        <Card style={styles.histogramCard}>
          <View style={styles.histogramRow}>
            {histogramData.map((item, i) => (
              <View key={i} style={styles.histogramCol}>
                <View style={styles.histogramBarWrapper}>
                  <View
                    style={[
                      styles.histogramBar,
                      {
                        height: item.ratio === 0 ? 4 : Math.max(item.ratio * 60, 6),
                        backgroundColor: barColor(item.ratio),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histogramDay}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ── Botões ── */}
        <View style={styles.buttonRow}>
          {activeFasting ? (
            <>
              <PressableScale haptic="light" style={{ flex: 1 }}>
                <View style={styles.btnPause}
                  accessibilityRole="button" accessibilityLabel="Pausar jejum">
                  <Text style={styles.btnPauseText}>Pausar</Text>
                </View>
              </PressableScale>
              <PressableScale
                onPress={handleEnd}
                disabled={isEnding}
                haptic="medium"
                style={{ flex: 2 }}
              >
                <View style={[styles.btnEnd, isEnding && styles.btnDisabled]}
                  accessibilityRole="button" accessibilityLabel="Encerrar jejum">
                  <Text style={styles.btnEndText}>
                    {isEnding ? 'Encerrando...' : 'Encerrar Jejum'}
                  </Text>
                </View>
              </PressableScale>
            </>
          ) : (
            <PressableScale
              onPress={handleStart}
              disabled={isStarting}
              haptic="medium"
              style={{ flex: 1 }}
            >
              <View style={[styles.btnEnd, styles.btnFull, isStarting && styles.btnDisabled]}
                accessibilityRole="button" accessibilityLabel="Iniciar jejum">
                <Text style={styles.btnEndText}>
                  {isStarting ? 'Iniciando...' : 'Iniciar Jejum'}
                </Text>
              </View>
            </PressableScale>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ESTILOS ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingBottom: 24,
  },

  // Topo
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.t1,
    fontFamily: fonts.serifRegular,
    paddingHorizontal: 22,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.t3,
    fontFamily: fonts.sansLight,
    paddingHorizontal: 22,
    marginBottom: 16,
    marginTop: 2,
  },

  // Pills
  pillsScroll: {
    marginBottom: 0,
  },
  pillsContainer: {
    paddingHorizontal: 22,
    gap: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: Colors.c2,
    borderColor: Colors.b2,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.b1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: Colors.t1,
  },
  pillTextInactive: {
    color: Colors.t3,
  },

  // Ring
  ringContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },

  // Janelas de horário
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  windowItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  windowTime: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.t1,
    fontVariant: ['tabular-nums'],
  },
  windowLabel: {
    fontSize: 11,
    color: Colors.t3,
  },
  windowDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: Colors.c3,
  },

  // Benefícios
  benefitPrimary: {
    fontSize: 13,
    color: Colors.t1,
    marginBottom: 6,
  },
  benefitSecondary: {
    fontSize: 12,
    color: Colors.t2,
    marginBottom: 4,
  },

  // Histórico
  historyLabel: {
    marginHorizontal: 22,
    marginTop: 4,
  },
  histogramCard: {
    paddingHorizontal: 14,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  histogramCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  histogramBarWrapper: {
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  histogramBar: {
    width: '60%',
    borderRadius: 3,
    minHeight: 4,
  },
  histogramDay: {
    fontSize: 10,
    color: Colors.t4,
  },

  // Botões
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 12,
    marginVertical: 16,
  },
  btnPause: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.b2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPauseText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.t1,
  },
  btnEnd: {
    flex: 1,
    backgroundColor: Colors.t1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: {
    flex: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnEndText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.bg,
  },
});
