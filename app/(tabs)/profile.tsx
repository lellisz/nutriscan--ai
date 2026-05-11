import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Colors, fonts } from '@/constants/design';
import { Colors as SpecColors } from '@/constants/Colors';
import { MenuRow } from '@/components/ui/MenuRow';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';

type ProfileToggleField =
  | 'compassion_mode'
  | 'quiet_intelligence'
  | 'adaptive_goals'
  | 'nutrition_memory';

// ─── Icon helpers ──────────────────────────────────────────────────────────────

function IconText({ char, color = Colors.t2 }: { char: string; color?: string }) {
  return <Text style={{ fontSize: 15, color, lineHeight: 20 }}>{char}</Text>;
}

// ─── Micronutrient ring ───────────────────────────────────────────────────────

function MicroRing({ progress }: { progress: number }) {
  const r = 19;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);
  return (
    <Svg width={46} height={46}>
      {/* Track */}
      <Circle
        cx={23}
        cy={23}
        r={r}
        stroke={Colors.c3}
        strokeWidth={4}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={23}
        cy={23}
        r={r}
        stroke={Colors.t1}
        strokeWidth={4}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation={-90}
        origin="23,23"
      />
    </Svg>
  );
}

// ─── Panel: Modo Compaixão ────────────────────────────────────────────────────

function CompassionPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState({
    ativar: true,
    detectar: true,
    score: true,
    recomeco: false,
  });

  function toggle(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <DetailPanel visible={visible} onClose={onClose} title="Modo Compaixão">
      <View style={panelStyles.section}>
        <Text style={panelStyles.description}>
          Quando você para por alguns dias, o PRAXIS detecta e muda o tom - sem cobrança, só apoio.
        </Text>
      </View>

      <View style={panelStyles.group}>
        <MenuRow
          title="Ativar Modo Compaixão"
          rightElement="toggle"
          toggleValue={settings.ativar}
          onToggle={() => toggle('ativar')}
        />
        <MenuRow
          title="Detectar após 3 dias"
          rightElement="toggle"
          toggleValue={settings.detectar}
          onToggle={() => toggle('detectar')}
        />
        <MenuRow
          title="Score sem punição"
          rightElement="toggle"
          toggleValue={settings.score}
          onToggle={() => toggle('score')}
        />
        <MenuRow
          title="Recomeço visível"
          rightElement="toggle"
          toggleValue={settings.recomeco}
          onToggle={() => toggle('recomeco')}
          isLast
        />
      </View>

      <View style={panelStyles.coachCard}>
        <Text style={panelStyles.coachLabel}>MENSAGEM DO COACH</Text>
        <Text style={panelStyles.coachMessage}>
          "Felipe, ontem foi pesado. Hoje é um novo dia - vamos devagar. Uma refeição leve para começar."
        </Text>
      </View>
    </DetailPanel>
  );
}

// ─── Panel: Micronutrientes ───────────────────────────────────────────────────

const MICROS = [
  { label: 'Vitamina A', value: 0.92, pct: '92%', deficit: false },
  { label: 'Vitamina B12', value: 0.41, pct: '41%', deficit: true },
  { label: 'Vitamina C', value: 0.88, pct: '88%', deficit: false },
  { label: 'Vitamina D', value: 0.34, pct: '34%', deficit: true },
  { label: 'Vitamina E', value: 0.71, pct: '71%', deficit: false },
  { label: 'Vitamina K', value: 0.95, pct: '95%', deficit: false },
];

function MicroPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <DetailPanel visible={visible} onClose={onClose} title="Micronutrientes">
      {/* Ring hero */}
      <View style={panelStyles.ringHero}>
        <MicroRing progress={0.78} />
        <Text style={panelStyles.ringTitle}>78% de cobertura</Text>
      </View>

      {/* List */}
      <View style={panelStyles.microList}>
        {MICROS.map((item) => (
          <View key={item.label} style={panelStyles.microRow}>
            <View style={panelStyles.microLabelRow}>
              <Text style={panelStyles.microLabel}>{item.label}</Text>
              <Text
                style={[
                  panelStyles.microPct,
                  item.deficit && { color: Colors.t3 },
                ]}
              >
                {item.pct}
                {item.deficit ? ' · déficit' : ''}
              </Text>
            </View>
            <ProgressBar
              value={item.value}
              height={3}
              opacity={item.deficit ? 0.5 : 1}
            />
          </View>
        ))}
      </View>
    </DetailPanel>
  );
}

// ─── Panel styles ─────────────────────────────────────────────────────────────

const panelStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.t2,
    lineHeight: 20,
  },
  group: {
    marginTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: Colors.b1,
  },
  coachCard: {
    margin: 20,
    backgroundColor: Colors.c2,
    borderWidth: 1,
    borderColor: Colors.b1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  coachLabel: {
    fontSize: 9,
    color: Colors.t4,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  coachMessage: {
    fontSize: 13,
    color: Colors.t2,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  ringHero: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  ringTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.t1,
  },
  microList: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 8,
  },
  microRow: {
    gap: 6,
  },
  microLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  microLabel: {
    fontSize: 12,
    color: Colors.t2,
  },
  microPct: {
    fontSize: 11,
    color: Colors.t2,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, profile } = useAuthStore();
  const insets = useSafeAreaInsets();

  // PRO toggles - initialized from the Supabase profile
  const [compassionOn, setCompassionOn] = useState(profile?.compassion_mode ?? false);
  const [quietOn, setQuietOn] = useState(profile?.quiet_intelligence ?? false);
  const [adaptiveOn, setAdaptiveOn] = useState(profile?.adaptive_goals ?? false);
  const [memoryOn, setMemoryOn] = useState(profile?.nutrition_memory ?? false);

  // Detail panels
  const [compassionPanel, setCompassionPanel] = useState(false);
  const [microPanel, setMicroPanel] = useState(false);

  useEffect(() => {
    setCompassionOn(profile?.compassion_mode ?? false);
    setQuietOn(profile?.quiet_intelligence ?? false);
    setAdaptiveOn(profile?.adaptive_goals ?? false);
    setMemoryOn(profile?.nutrition_memory ?? false);
  }, [profile]);

  async function updateToggle(field: ProfileToggleField, value: boolean) {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('user_id', user.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  }

  // Extract initials from profile name
  const initials = (profile?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.root}>
      {/* ── Main content ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Header row */}
        <View style={[styles.headerBg, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>I D E N T I D A D E</Text>
            <Pressable
              style={styles.settingsBtn}
              onPress={() => router.push('/settings')}
              hitSlop={8}
            >
              <Text style={styles.settingsIcon}>&#8857;</Text>
            </Pressable>
          </View>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.name ?? 'Usuário'}</Text>
            <Text style={styles.userBadge}>MEMBRO PREMIUM</Text>
            <Text style={styles.userSub}>desde jan 2025</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsCard}>
          {[
            { value: String(profile?.weight_kg ?? '--'), label: 'PESO ATUAL' },
            { value: String(profile?.target_weight_kg ?? '--'), label: 'META PESO' },
            { value: '34', label: 'REGISTROS' },
            { value: '2.1k', label: 'META KCAL' },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statCol}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── PRAXIS PRO section ── */}
        <Text style={styles.sectionLabel}>PRAXIS PRO</Text>
        <View style={styles.group}>
          <MenuRow
            isPro
            iconElement={<IconText char="◈" color={Colors.t2} />}
            title="Modo Compaixão"
            desc="Tom de recuperação"
            rightElement="toggle"
            toggleValue={compassionOn}
            onToggle={() => {
              const nextValue = !compassionOn;
              setCompassionOn(nextValue);
              void updateToggle('compassion_mode', nextValue);
            }}
            onPress={() => setCompassionPanel(true)}
          />
          <MenuRow
            isPro
            iconElement={<IconText char="◇" color={Colors.t2} />}
            title="Quiet Intelligence"
            desc="Silêncio padrão"
            rightElement="toggle"
            toggleValue={quietOn}
            onToggle={() => {
              const nextValue = !quietOn;
              setQuietOn(nextValue);
              void updateToggle('quiet_intelligence', nextValue);
            }}
          />
          <MenuRow
            isPro
            iconElement={<IconText char="△" color={Colors.t2} />}
            title="Parceiros PRAXIS"
            rightElement="badge"
            badgeText="0/3"
            onPress={() => {}}
          />
          <MenuRow
            isPro
            iconElement={<IconText char="○" color={Colors.t2} />}
            title="Meta adaptativa"
            desc="Ajusta com contexto"
            rightElement="toggle"
            toggleValue={adaptiveOn}
            onToggle={() => {
              const nextValue = !adaptiveOn;
              setAdaptiveOn(nextValue);
              void updateToggle('adaptive_goals', nextValue);
            }}
          />
          <MenuRow
            isPro
            iconElement={<IconText char="□" color={Colors.t2} />}
            title="Memória nutricional"
            desc="Sugere com 1 toque"
            rightElement="toggle"
            toggleValue={memoryOn}
            onToggle={() => {
              const nextValue = !memoryOn;
              setMemoryOn(nextValue);
              void updateToggle('nutrition_memory', nextValue);
            }}
            isLast
          />
        </View>

        {/* ── SAÚDE E DADOS section ── */}
        <Text style={styles.sectionLabel}>SAÚDE E DADOS</Text>
        <View style={styles.group}>
          <MenuRow
            iconElement={<IconText char="◎" />}
            title="Micronutrientes"
            rightElement="badge"
            badgeText="78% cob."
            onPress={() => setMicroPanel(true)}
          />
          <MenuRow
            iconElement={<IconText char="◉" />}
            title="Fotos de progresso"
            rightElement="chevron"
            onPress={() => {}}
          />
          <MenuRow
            iconElement={<IconText char="◈" />}
            title="Evolução e gráficos"
            rightElement="chevron"
            onPress={() => {}}
          />
          <MenuRow
            iconElement={<IconText char="◻" />}
            title="Medidas corporais"
            rightElement="chevron"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* ── CONFIGURAÇÕES section ── */}
        <Text style={styles.sectionLabel}>CONFIGURAÇÕES</Text>
        <View style={styles.group}>
          <MenuRow
            iconElement={<IconText char="◷" />}
            title="Meus dados (LGPD)"
            rightElement="chevron"
            onPress={() => router.push('/settings')}
          />
          <MenuRow
            iconElement={<IconText char="◶" />}
            title="Notificações"
            rightElement="chevron"
            onPress={() => {}}
          />
          <MenuRow
            iconElement={<IconText char="◵" />}
            title="Privacidade"
            rightElement="chevron"
            onPress={() => {}}
          />
          <MenuRow
            iconElement={<IconText char="◴" />}
            title="Conectar wearable"
            rightElement="badge"
            badgeText="Novo"
            onPress={() => {}}
          />
          <MenuRow
            iconElement={<IconText char="◫" />}
            title="Ajuda e suporte"
            rightElement="chevron"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>PRAXIS · v2.0</Text>
      </ScrollView>

      {/* ── Detail panels (absolute, rendered last so they sit on top) ── */}
      <CompassionPanel
        visible={compassionPanel}
        onClose={() => setCompassionPanel(false)}
      />
      <MicroPanel
        visible={microPanel}
        onClose={() => setMicroPanel(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SpecColors.BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Header
  headerBg: {
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    letterSpacing: 6,
    color: SpecColors.WH,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 22,
    color: SpecColors.W3,
  },

  // User card
  userCard: {
    backgroundColor: SpecColors.C1,
    borderWidth: 0.5,
    borderColor: SpecColors.B1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },

  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: SpecColors.B1,
    backgroundColor: SpecColors.C2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: SpecColors.WH,
  },

  // User info text
  userName: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: SpecColors.WH,
  },
  userBadge: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: SpecColors.AC,
  },
  userSub: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: SpecColors.W3,
  },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: SpecColors.C1,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: SpecColors.B1,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.monoRegular,
    fontSize: 18,
    color: SpecColors.WH,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 9,
    letterSpacing: 1.5,
    color: SpecColors.W3,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 0.5,
    backgroundColor: SpecColors.B1,
    alignSelf: 'stretch',
    marginVertical: 4,
  },

  // Sections
  sectionLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: SpecColors.W3,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  group: {
    borderTopWidth: 0.5,
    borderTopColor: SpecColors.B1,
  },

  // Footer
  footer: {
    fontFamily: fonts.sansLight,
    fontSize: 9,
    letterSpacing: 1.5,
    color: SpecColors.W4,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
