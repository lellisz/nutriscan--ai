import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, fonts } from '@/constants/design';

export interface TimelineMeal {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  status: 'active' | 'medium' | 'empty';
}

function Dot({ status }: { status: TimelineMeal['status'] }) {
  if (status === 'active') {
    return (
      <Svg width={7} height={7} viewBox="0 0 7 7">
        <Circle cx={3.5} cy={3.5} r={3.5} fill={Colors.t1} />
      </Svg>
    );
  }
  if (status === 'medium') {
    return (
      <Svg width={7} height={7} viewBox="0 0 7 7">
        <Circle cx={3.5} cy={3.5} r={3.5} fill={Colors.t2} opacity={0.5} />
      </Svg>
    );
  }
  return (
    <Svg width={7} height={7} viewBox="0 0 7 7">
      <Circle cx={3.5} cy={3.5} r={3} fill="none" stroke={Colors.t5} strokeWidth={1.5} />
    </Svg>
  );
}

function nameColor(status: TimelineMeal['status']): string {
  if (status === 'active') return Colors.t1;
  if (status === 'medium') return Colors.t2;
  return Colors.t5;
}

interface MealTimelineProps {
  meals: TimelineMeal[];
}

const EMPTY_MESSAGES = [
  'Seu primeiro registro define o ponto de partida.\nSem pressa.',
  'Cada refeição registrada é um dado.\nPraxi aprende com todos eles.',
  'Registre quando quiser.\nNão existe horário errado.',
];

export function MealTimeline({ meals }: MealTimelineProps) {
  const allEmpty = meals.length === 0 || meals.every((m) => m.status === 'empty');

  if (allEmpty) {
    const msg = EMPTY_MESSAGES[new Date().getDay() % EMPTY_MESSAGES.length];
    return (
      <View style={{ paddingVertical: 28, paddingHorizontal: 10, alignItems: 'center' }}>
        <Text style={{
          fontFamily: fonts.serifLight,
          fontSize: 15,
          color: Colors.t3,
          lineHeight: 23,
          textAlign: 'center',
        }}>
          {msg}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {meals.map((meal, index) => {
        const isLast = index === meals.length - 1;
        return (
          <View key={meal.id} style={{ paddingBottom: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ alignItems: 'center', width: 20, paddingTop: 3 }}>
                <Dot status={meal.status} />
                {!isLast && (
                  <View style={{ width: 1, height: 26, backgroundColor: Colors.c4, marginTop: 4 }} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, color: Colors.t4, letterSpacing: 0.8 }}>
                    {meal.time}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 12,
                  color: nameColor(meal.status),
                  marginBottom: 2,
                  fontWeight: meal.status === 'active' ? '500' : '400',
                }}>
                  {meal.name}
                </Text>
                {meal.status !== 'empty' && (
                  <Text style={{ fontSize: 10.5, color: Colors.t3 }}>
                    {meal.calories} kcal · {meal.protein}g prot · {meal.carbs}g carbs
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
