// app/(onboarding)/consent.tsx
// Tela de Consentimento LGPD — obrigatória antes de usar o app
// LGPD Art. 7 e 11 — consentimento não pode ser pré-marcado nem genérico

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, fonts } from '@/constants/design';
import { VLine } from '@/components/ui/VLine';
import { Toggle } from '@/components/ui/Toggle';
import { grantConsent } from '@/services/consent';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/app/(onboarding)/personal';

// ─── ConsentItem ────────────────────────────────────────────────────────────

interface ConsentItemProps {
  required?: boolean;
  checked:   boolean;
  onToggle:  () => void;
  title:     string;
  description: string;
}

function ConsentItem({ required, checked, onToggle, title, description }: ConsentItemProps) {
  return (
    <View style={[styles.consentCard, checked && required && styles.consentCardActive]}>
      <View style={styles.consentRow}>
        <View style={styles.consentText}>
          <View style={styles.consentTitleRow}>
            <Text style={styles.consentTitle}>{title}</Text>
            {required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>OBRIGATÓRIO</Text>
              </View>
            )}
          </View>
          <Text style={styles.consentDesc}>{description}</Text>
        </View>
        <Toggle value={checked} onToggle={onToggle} />
      </View>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ConsentScreen() {
  // NÃO PRÉ-MARCAR — LGPD exige consentimento ativo e explícito
  const [health, setHealth]   = useState(false); // obrigatório
  const [coach,  setCoach]    = useState(false); // opcional

  const canProceed = health;
  const setHasCompletedOnboarding = useAuthStore((state) => state.setHasCompletedOnboarding);

  const { setConsents } = useOnboardingStore();

  function handleBack() {
    setHasCompletedOnboarding(true);
    router.replace('/(auth)');
  }

  async function handleAccept() {
    try {
      // O insert na DB é adiado para o final do onboarding (results.tsx)
      // para garantir que a tabela `profiles` já exista, evitando o erro de Foreign Key.
      setConsents(health, coach);
      router.push('/(onboarding)/goal');
    } catch (e: any) {
      console.error('Erro ao processar consentimento:', e);
      alert('Erro ao avançar: ' + (e.message || String(e)));
    }
  }

  function handleSkip() {
    // Usar sem dados de saúde — modo limitado
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <VLine />

        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>← VOLTAR</Text>
        </Pressable>

        <View style={styles.progress}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={[styles.dot, n === 1 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.step}>PASSO 1 DE 4</Text>

        <Text style={styles.title}>Seus dados,{'\n'}seu controle.</Text>
        <Text style={styles.subtitle}>
          Para calcular seu PRAXIS Score precisamos processar seus dados de saúde.
          Você pode revogar e deletar tudo a qualquer momento em Configurações.
        </Text>

        {/* ── Consentimentos ── */}
        <ConsentItem
          required
          checked={health}
          onToggle={() => setHealth(!health)}
          title="Dados de saúde"
          description="Refeições, hidratação e sono para calcular seu Score e gerar insights. Armazenados com criptografia AES-256."
        />

        <ConsentItem
          checked={coach}
          onToggle={() => setCoach(!coach)}
          title="Coach Praxi IA — opcional"
          description="Permite que nossa IA analise seus padrões ao longo do tempo para sugestões cada vez mais personalizadas."
        />

        {/* ── Legal ── */}
        <Text style={styles.legalText}>
          Seus dados{' '}
          <Text style={styles.bold}>NUNCA</Text>
          {' '}são vendidos ou compartilhados com terceiros.{'\n'}
          Você pode exportar ou deletar tudo a qualquer momento.
        </Text>

        <Pressable onPress={() => Linking.openURL('https://praxisnutrition.com.br/privacidade')}>
          <Text style={styles.policyLink}>Ler Política de Privacidade completa →</Text>
        </Pressable>

        {/* ── Botão principal ── */}
        <Pressable
          onPress={canProceed ? handleAccept : undefined}
          style={[styles.btnPrimary, !canProceed && styles.btnDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canProceed }}
        >
          <Text style={[styles.btnPrimaryText, !canProceed && styles.btnDisabledText]}>
            Concordo e quero começar
          </Text>
        </Pressable>

        {/* ── Opção sem dados ── */}
        <Pressable onPress={handleSkip} style={styles.btnSkip}>
          <Text style={styles.btnSkipText}>
            Prefiro usar sem salvar dados de saúde
          </Text>
        </Pressable>

        <Text style={styles.contact}>
          privacidade@praxisnutrition.com.br{'\n'}
          Respondemos em até 15 dias corridos (LGPD Art. 18)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.px,
    paddingBottom: 48,
  },
  backBtn: {
    marginBottom: 28,
  },
  backText: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: Colors.t3,
    letterSpacing: 2,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 24,
    height: 2,
    backgroundColor: Colors.b2,
  },
  dotActive: {
    backgroundColor: Colors.gold,
  },
  step: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: Colors.t3,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    color: Colors.t1,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: Colors.t3,
    lineHeight: 20,
    marginBottom: 28,
  },
  consentCard: {
    backgroundColor: Colors.c1,
    borderWidth: 1,
    borderColor: Colors.b1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  consentCardActive: {
    borderColor: Colors.b2,
  },
  consentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  consentText: {
    flex: 1,
    marginRight: 12,
  },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  consentTitle: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: Colors.t1,
  },
  requiredBadge: {
    backgroundColor: Colors.c3,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  requiredText: {
    fontFamily: fonts.sansLight,
    fontSize: 9,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  consentDesc: {
    fontFamily: fonts.sansLight,
    fontSize: 12,
    color: Colors.t3,
    lineHeight: 18,
  },
  legalText: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: Colors.t3,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  bold: {
    color: Colors.t1,
  },
  policyLink: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 24,
    textDecorationLine: 'underline',
  },
  btnPrimary: {
    backgroundColor: Colors.t1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: {
    backgroundColor: Colors.c3,
  },
  btnPrimaryText: {
    fontFamily: fonts.sansLight,
    color: Colors.bg,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnDisabledText: {
    color: Colors.t3,
  },
  btnSkip: {
    padding: 14,
    alignItems: 'center',
  },
  btnSkipText: {
    fontFamily: fonts.sansLight,
    color: Colors.t3,
    fontSize: 12,
  },
  contact: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: Colors.t3,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
});
