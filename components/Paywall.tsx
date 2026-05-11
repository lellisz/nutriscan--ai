import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Colors, fonts, fontSizes } from '@/constants/design';
import { purchaseSubscription, SubscriptionPlan } from '@/services/revenue';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  'Coach ilimitado',
  'Barcode Scanner',
  'Meal Planning',
  'Fotos de progresso',
  'HealthKit',
  'Export PDF',
  'Historico ilimitado',
];

function PraxisTriangle() {
  return (
    <Svg viewBox="0 0 40 35" width={32} height={28}>
      <Polygon
        points="20,2 2,33 38,33"
        fill="none"
        stroke={Colors.gold}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Paywall({ visible, onClose }: PaywallProps) {
  const handlePurchase = async (plan: SubscriptionPlan) => {
    const success = await purchaseSubscription(plan);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Close button */}
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Text style={styles.closeText}>x</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <PraxisTriangle />
            <Text style={styles.title}>PRAXIS PREMIUM</Text>
          </View>

          {/* Features */}
          <ScrollView
            style={styles.featuresScroll}
            showsVerticalScrollIndicator={false}
          >
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.featureCheck}>ok</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Annual button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
            onPress={() => handlePurchase('annual')}
            accessibilityRole="button"
            accessibilityLabel="Assinar plano anual"
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ECONOMIZE 37%</Text>
            </View>
            <Text style={styles.primaryBtnText}>ANUAL . R$ 149,90/ano</Text>
          </Pressable>

          {/* Monthly button */}
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed,
            ]}
            onPress={() => handlePurchase('monthly')}
            accessibilityRole="button"
            accessibilityLabel="Assinar plano mensal"
          >
            <Text style={styles.secondaryBtnText}>MENSAL . R$ 19,90/mes</Text>
          </Pressable>

          {/* Fine print */}
          <Text style={styles.finePrint}>
            7 dias gratis . Cancele quando quiser
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,7,13,0.9)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.c1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 20,
    color: Colors.t3,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes.xl,
    color: Colors.t1,
    letterSpacing: 3,
  },
  featuresScroll: {
    maxHeight: 200,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureCheck: {
    fontSize: 14,
    color: Colors.gold,
  },
  featureText: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t2,
  },
  primaryBtn: {
    backgroundColor: Colors.t1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: Colors.bg,
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.b2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryBtnPressed: {
    backgroundColor: Colors.b1,
  },
  secondaryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: Colors.t2,
    letterSpacing: 1,
  },
  finePrint: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    color: Colors.t4,
    textAlign: 'center',
  },
});
