import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, fonts, fontSizes } from '@/constants/design';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <Text style={styles.title}>Política de Privacidade</Text>
        <Text style={styles.meta}>PRAXIS Nutrition · v1.0 · Vigência: maio 2026</Text>

        <Section title="1. Quem somos">
          PRAXIS Nutrition é um aplicativo de acompanhamento nutricional. Seus dados são tratados com base no seu consentimento explícito (LGPD Art. 7, inciso I).
        </Section>

        <Section title="2. Dados coletados">
          Coletamos dados que você fornece voluntariamente: refeições registradas, fotos de alimentos, mensagens ao coach de IA, métricas corporais (peso, altura, meta calórica), registros de hidratação e informações de perfil. Dados de saúde são tratados como dados sensíveis (LGPD Art. 11).
        </Section>

        <Section title="3. Como usamos seus dados">
          Seus dados são usados exclusivamente para calcular seu score nutricional, personalizar respostas do coach de IA e gerar relatórios de progresso. Nenhum dado é compartilhado com terceiros para fins publicitários.
        </Section>

        <Section title="4. Inteligência Artificial">
          O coach utiliza Groq (LLaMA) e Gemini Vision. Suas mensagens são processadas por esses serviços para gerar respostas. Consulte as políticas de privacidade da Groq e Google para detalhes sobre tratamento nos servidores deles.
        </Section>

        <Section title="5. Armazenamento">
          Seus dados ficam armazenados no Supabase (servidores na região South America). O acesso é protegido por Row Level Security — nenhum dado seu é acessível por outros usuários.
        </Section>

        <Section title="6. Seus direitos (LGPD Art. 18)">
          Você tem direito a: acessar seus dados, corrigir dados incorretos, exportar seus dados em formato legível, e solicitar a exclusão permanente. Todos esses controles estão disponíveis nas configurações do app.
        </Section>

        <Section title="7. Consentimento">
          Você pode revogar consentimentos específicos a qualquer momento em Configurações → Privacidade. A revogação não retroage, mas interrompe o tratamento futuro dos dados cobertos.
        </Section>

        <Section title="8. Contato">
          Dúvidas sobre esta política: felipelellis04@gmail.com
        </Section>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>FECHAR</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 24 },
  closeBtn: { alignSelf: 'flex-end', minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  closeText: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3 },
  title: { fontFamily: fonts.serifLight, fontSize: fontSizes['2xl'], color: Colors.t1, marginBottom: 6 },
  meta: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t4, letterSpacing: 1, marginBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: fonts.sansMedium, fontSize: fontSizes.sm, color: Colors.t2, marginBottom: 8, letterSpacing: 0.5 },
  sectionBody: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3, lineHeight: 22 },
  backBtn: { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.b1, borderRadius: 8 },
  backText: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3, letterSpacing: 2 },
});
