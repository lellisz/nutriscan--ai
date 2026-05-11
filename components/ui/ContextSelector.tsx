import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Colors } from '@/constants/design';
import { useDailyStore, DailyContext } from '@/stores/dailyStore';

const PILLS: { label: string; value: DailyContext }[] = [
  { label: 'Normal',      value: 'normal'    },
  { label: 'Estressado',  value: 'stress'    },
  { label: 'Viagem',      value: 'travel'    },
  { label: 'Comemorando', value: 'celebrate' },
  { label: 'Dia difícil', value: 'hard'      },
  { label: 'Restrição',   value: 'restricao' },
  { label: 'Academia',    value: 'academia'  },
];

export function ContextSelector() {
  const { context, setContext } = useDailyStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 7, paddingHorizontal: 2 }}
    >
      {PILLS.map((pill) => {
        const isActive = context === pill.value;
        return (
          <Pressable
            key={pill.value}
            onPress={() => setContext(pill.value)}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: isActive ? Colors.c2 : 'transparent',
              borderWidth: 1,
              borderColor: isActive ? Colors.b2 : Colors.b1,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: isActive ? '500' : '400',
                color: isActive ? Colors.t1 : Colors.t3,
              }}
            >
              {pill.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
