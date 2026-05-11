import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { Colors } from '@/constants/design';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { getFrequentMeals, FrequentMeal } from '@/services/daily';
import { useAuthStore } from '@/stores/authStore';

// ─── Ícones SVG ──────────────────────────────────────────────────────────────

function IconCamera() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19C23 19.5 22.8 20 22.4 20.4C22 20.8 21.5 21 21 21H3C2.5 21 2 20.8 1.6 20.4C1.2 20 1 19.5 1 19V8C1 7.5 1.2 7 1.6 6.6C2 6.2 2.5 6 3 6H7L9 3H15L17 6H21C21.5 6 22 6.2 22.4 6.6C22.8 7 23 7.5 23 8V19Z"
        stroke={Colors.t3}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={4} stroke={Colors.t3} strokeWidth={1.5} />
    </Svg>
  );
}

function IconMic() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1C10.3 1 9 2.3 9 4V12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12V4C15 2.3 13.7 1 12 1Z"
        stroke={Colors.t3}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10"
        stroke={Colors.t3}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={12}
        y1={19}
        x2={12}
        y2={23}
        stroke={Colors.t3}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconPin() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.6 4 5.4 5.8 3.8C7.6 2.2 10 1.2 12 1C16.4 1.4 21 5.1 21 10Z"
        stroke={Colors.t3}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={3} stroke={Colors.t3} strokeWidth={1.5} />
    </Svg>
  );
}

function IconList() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Line x1={8} y1={6} x2={21} y2={6} stroke={Colors.t3} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={8} y1={12} x2={21} y2={12} stroke={Colors.t3} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={8} y1={18} x2={21} y2={18} stroke={Colors.t3} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={3} cy={6} r={1} fill={Colors.t3} />
      <Circle cx={3} cy={12} r={1} fill={Colors.t3} />
      <Circle cx={3} cy={18} r={1} fill={Colors.t3} />
    </Svg>
  );
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Mode {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface Meal {
  nome: string;
  kcal: number;
  prot: number;
}

// ─── Dados estáticos ─────────────────────────────────────────────────────────

const MODES: Mode[] = [
  {
    title: 'Snap & Count',
    desc: 'Foto → IA calcula macros',
    icon: <IconCamera />,
    onPress: () => router.push('/log/camera'),
  },
  {
    title: 'Por voz',
    desc: 'Fale o que comeu',
    icon: <IconMic />,
    onPress: () => router.push('/log/voice'),
  },
  {
    title: 'Modo restaurante',
    desc: 'Diga o lugar e o prato',
    icon: <IconPin />,
    onPress: () => router.push('/log/restaurant'),
  },
  {
    title: 'Buscar alimento',
    desc: 'Database brasileiro',
    icon: <IconList />,
    onPress: () => router.push('/log/add'),
  },
];

const FALLBACK_MEALS: Meal[] = [
  { nome: 'Ovo mexido + aveia', kcal: 430, prot: 18 },
  { nome: 'Frango grelhado + arroz', kcal: 680, prot: 42 },
  { nome: 'Iogurte + granola', kcal: 220, prot: 14 },
];

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function ModeCard({ mode }: { mode: Mode }) {
  return (
    <Pressable
      onPress={mode.onPress}
      style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
    >
      <View style={styles.modeIconWrap}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Circle
            cx={20}
            cy={20}
            r={19}
            stroke={Colors.t4}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
        <View style={styles.modeIconInner}>{mode.icon}</View>
      </View>
      <Text style={styles.modeTitle}>{mode.title}</Text>
      <Text style={styles.modeDesc}>{mode.desc}</Text>
    </Pressable>
  );
}

function MealRow({ meal, isLast }: { meal: Meal; isLast: boolean }) {
  return (
    <>
      <View style={styles.mealRow}>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.nome}</Text>
          <Text style={styles.mealMeta}>{meal.kcal} kcal · {meal.prot}g prot</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={() => console.log('add', meal.nome)}
          hitSlop={8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
      {!isLast && <View style={styles.separator} />}
    </>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────────────

export default function LogModal() {
  const { user } = useAuthStore();
  const [frequentMeals, setFrequentMeals] = useState<Meal[]>(FALLBACK_MEALS);

  useEffect(() => {
    if (!user) return;
    getFrequentMeals(user.id)
      .then((data: FrequentMeal[]) => {
        if (data.length > 0) {
          setFrequentMeals(
            data.map((m) => ({ nome: m.name, kcal: m.calories, prot: m.protein })),
          );
        }
        // Se vazio, mantém o fallback hardcoded
      })
      .catch(() => {
        // Em caso de erro mantém fallback
      });
  }, [user]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registrar</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.headerCancel}>Cancelar</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modos de registro */}
        <SectionLabel style={styles.sectionLabelModes}>
          Como você quer registrar?
        </SectionLabel>

        <View style={styles.modesGrid}>
          {MODES.map((mode) => (
            <ModeCard key={mode.title} mode={mode} />
          ))}
        </View>

        {/* Refeições frequentes */}
        <SectionLabel style={styles.sectionLabelMeals}>
          Refeições frequentes
        </SectionLabel>

        <Card style={styles.mealsCard}>
          {frequentMeals.map((meal, i) => (
            <MealRow
              key={meal.nome}
              meal={meal}
              isLast={i === frequentMeals.length - 1}
            />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.t1,
    letterSpacing: -0.2,
  },
  headerCancel: {
    fontSize: 13,
    color: Colors.t3,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Section labels
  sectionLabelModes: {
    paddingHorizontal: 22,
    marginTop: 8,
  },
  sectionLabelMeals: {
    paddingHorizontal: 22,
    marginTop: 16,
  },

  // Modes grid
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  modeCard: {
    width: '47%',
    backgroundColor: Colors.c1,
    borderWidth: 1,
    borderColor: Colors.b1,
    borderRadius: 18,
    alignItems: 'center',
    padding: 20,
  },
  modeCardPressed: {
    backgroundColor: Colors.c2,
  },
  modeIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.t1,
    marginTop: 12,
    textAlign: 'center',
  },
  modeDesc: {
    fontSize: 11,
    color: Colors.t3,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  // Meals card
  mealsCard: {
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  mealInfo: {
    flex: 1,
    gap: 3,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.t1,
  },
  mealMeta: {
    fontSize: 11,
    color: Colors.t3,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.c3,
    borderWidth: 1,
    borderColor: Colors.b1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: Colors.c4,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.t2,
    lineHeight: 20,
    includeFontPadding: false,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.b1,
  },
});
