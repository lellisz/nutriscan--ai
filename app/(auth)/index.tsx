import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/design";
import { MetallicButton } from "@/components/ui/MetallicButton";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      {/* TOPO (1/3) */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.topSection}>
        {/* Triângulo outline W3 sobre BG */}
        <View style={styles.triangleContainer}>
          {/* triângulo externo W3 */}
          <View style={styles.triangleOuter} />
          {/* triângulo interno BG para criar outline */}
          <View style={styles.triangleInner} />
        </View>

        <Text style={styles.logoText}>P R A X I S</Text>
        <Text style={styles.nutritionText}>N U T R I T I O N</Text>
        <View style={styles.dividerLine} />
      </Animated.View>

      {/* MEIO (1/3) */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.middleSection}>
        <Text style={styles.tagline}>Nutrição de precisão.</Text>
        <Text style={styles.taglineSub}>
          IA que analisa, aprende e evolui com você.
        </Text>
      </Animated.View>

      {/* BAIXO (1/3) */}
      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.bottomSection}>
        <MetallicButton
          variant="primary"
          label="COMEÇAR AGORA"
          onPress={() => router.push("/(auth)/register")}
          style={styles.primaryButton}
        />
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.secondaryButtonText}>JÁ TENHO CONTA</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  // TOPO
  topSection: {
    alignItems: "center",
  },
  triangleContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 21,
    marginBottom: 16,
  },
  triangleOuter: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 21,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.W3,
  },
  triangleInner: {
    position: "absolute",
    top: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.BG,
  },
  logoText: {
    fontFamily: fonts.serifLight,
    fontSize: 32,
    letterSpacing: 8,
    color: Colors.WH,
  },
  nutritionText: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    letterSpacing: 6,
    color: Colors.W3,
    marginTop: 4,
  },
  dividerLine: {
    width: 32,
    height: 0.5,
    backgroundColor: Colors.W3,
    marginTop: 12,
  },
  // MEIO
  middleSection: {
    alignItems: "center",
  },
  tagline: {
    fontFamily: fonts.serifRegularItalic,
    fontSize: 22,
    color: Colors.WH,
    textAlign: "center",
  },
  taglineSub: {
    fontFamily: fonts.sansLight,
    fontSize: 13,
    color: Colors.W3,
    textAlign: "center",
    marginTop: 8,
  },
  // BAIXO
  bottomSection: {
    alignItems: "center",
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    letterSpacing: 3,
    color: Colors.W3,
    textAlign: "center",
  },
});
