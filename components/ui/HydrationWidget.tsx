import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, fonts, fontSizes } from '@/constants/design';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useAuthStore } from '@/stores/authStore';

const QUICK_AMOUNTS = [150, 250, 350, 500] as const;

export function HydrationWidget() {
  const { user } = useAuthStore();
  const { goal_ml, consumed_ml, addWater } = useHydrationStore();

  const progress = goal_ml > 0 ? Math.min(consumed_ml / goal_ml, 1) : 0;
  const progressPercent = Math.round(progress * 100);

  const handleAddWater = async (ml: number) => {
    await addWater(ml, user?.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>HIDRATACAO . HOJE</Text>

      <View style={styles.row}>
        {/* Progress ring simples */}
        <View style={styles.ringContainer}>
          <View style={styles.ringTrack}>
            <View style={[styles.ringFill, { height: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.ringText}>{progressPercent}%</Text>
        </View>

        <View style={styles.statsCol}>
          <Text style={styles.consumed}>{consumed_ml}</Text>
          <Text style={styles.goal}>/ {goal_ml} ml</Text>
        </View>
      </View>

      <View style={styles.buttonsRow}>
        {QUICK_AMOUNTS.map((ml) => (
          <Pressable
            key={ml}
            style={({ pressed }) => [
              styles.btn,
              pressed && styles.btnPressed,
            ]}
            onPress={() => handleAddWater(ml)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${ml} mililitros de agua`}
          >
            <Text style={styles.btnText}>+{ml}ml</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.c1,
    borderWidth: 1,
    borderColor: Colors.b1,
    borderRadius: 14,
    padding: 16,
  },
  label: {
    fontFamily: fonts.sansLight,
    fontSize: 10,
    color: Colors.t4,
    letterSpacing: 2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  ringContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: Colors.c3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  ringFill: {
    width: '100%',
    backgroundColor: Colors.t2,
  },
  ringText: {
    fontFamily: fonts.monoLight,
    fontSize: 12,
    color: Colors.t1,
  },
  statsCol: {
    flex: 1,
    gap: 2,
  },
  consumed: {
    fontFamily: fonts.monoLight,
    fontSize: 28,
    color: Colors.t1,
    fontVariant: ['tabular-nums'],
  },
  goal: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.c2,
    borderWidth: 1,
    borderColor: Colors.b2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  btnPressed: {
    backgroundColor: Colors.b2,
  },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t2,
    letterSpacing: 0.5,
  },
});
