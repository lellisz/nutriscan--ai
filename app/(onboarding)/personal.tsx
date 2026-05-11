import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import Reanimated, { FadeInDown } from "react-native-reanimated";
import { Colors, fonts, fontSizes, spacing } from "@/constants/design";
import { Sex } from "@/types";
import { create } from "zustand";
import { WheelPicker } from "@/components/WheelPicker";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface OnboardingState {
  name: string;
  age: string;
  height: string;
  weight: string;
  targetWeight: string;
  gender: Sex;
  healthConsent: boolean;
  coachConsent: boolean;
  setField: (field: string, value: string) => void;
  setGender: (g: Sex) => void;
  setConsents: (health: boolean, coach: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  name: "",
  age: "",
  height: "",
  weight: "",
  targetWeight: "",
  gender: "M",
  healthConsent: false,
  coachConsent: false,
  setField: (field, value) => set({ [field]: value }),
  setGender: (gender) => set({ gender }),
  setConsents: (health, coach) => set({ healthConsent: health, coachConsent: coach }),
}));

// ---------------------------------------------------------------------------
// Picker data
// ---------------------------------------------------------------------------

const AGE_ARR = Array.from({ length: 71 }, (_, i) => String(i + 10));     // 10–80
const HEIGHT_ARR = Array.from({ length: 81 }, (_, i) => String(i + 140)); // 140–220 cm
const WEIGHT_ARR = Array.from({ length: 171 }, (_, i) => String(i + 30)); // 30–200 kg

const DEFAULT_AGE_IDX = 15;    // 25 anos
const DEFAULT_HEIGHT_IDX = 30; // 170 cm
const DEFAULT_WEIGHT_IDX = 40; // 70 kg
const DEFAULT_TARGET_IDX = 35; // 65 kg

function findIdx(arr: string[], val: string, def: number) {
  if (!val) return def;
  const i = arr.indexOf(val);
  return i >= 0 ? i : def;
}

// ---------------------------------------------------------------------------
// PickerField — animated collapsible row + inline WheelPicker
// ---------------------------------------------------------------------------

const PICKER_H = 48 * 5; // matches WheelPicker ITEM_H * VISIBLE
const ANIM_DURATION = 260;

type FieldKey = "age" | "height" | "weight" | "targetWeight";

interface PickerFieldProps {
  fieldKey: FieldKey;
  label: string;
  unit: string;
  items: string[];
  selectedIndex: number;
  displayValue: string;
  pickerWidth: number;
  isOpen: boolean;
  onToggle: (key: FieldKey) => void;
  onChange: (idx: number) => void;
}

function PickerField({
  fieldKey,
  label,
  unit,
  items,
  selectedIndex,
  displayValue,
  pickerWidth,
  isOpen,
  onToggle,
  onChange,
}: PickerFieldProps) {
  const heightAnim = useRef(new Animated.Value(isOpen ? PICKER_H : 0)).current;
  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: isOpen ? PICKER_H : 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(chevronAnim, {
        toValue: isOpen ? 1 : 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [isOpen]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const rowBorderColor = isOpen ? Colors.gold : Colors.b2;

  return (
    <View style={styles.fieldGroup}>
      {/* Tappable display row */}
      <Pressable
        style={[styles.pickerRow, { borderBottomColor: rowBorderColor }]}
        onPress={() => onToggle(fieldKey)}
        hitSlop={8}
      >
        <Text style={styles.label}>{label}</Text>

        <View style={styles.pickerRowRight}>
          <Text style={[styles.pickerValue, isOpen && styles.pickerValueActive]}>
            {displayValue}
          </Text>
          <Text style={[styles.pickerUnit, isOpen && styles.pickerUnitActive]}>
            {" "}{unit}
          </Text>
          <Animated.Text
            style={[styles.chevron, { transform: [{ rotate: chevronRotate }] }]}
          >
            ›
          </Animated.Text>
        </View>
      </Pressable>

      {/* Collapsible picker */}
      <Animated.View style={[styles.pickerWrapper, { height: heightAnim }]}>
        <View style={styles.pickerInner}>
          <WheelPicker
            items={items}
            selectedIndex={selectedIndex}
            onChange={onChange}
            width={pickerWidth}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PersonalScreen() {
  const { width } = useWindowDimensions();
  const { name, age, height, weight, targetWeight, gender, setField, setGender } =
    useOnboardingStore();

  const [ageIdx, setAgeIdx] = useState(() => findIdx(AGE_ARR, age, DEFAULT_AGE_IDX));
  const [heightIdx, setHeightIdx] = useState(() => findIdx(HEIGHT_ARR, height, DEFAULT_HEIGHT_IDX));
  const [weightIdx, setWeightIdx] = useState(() => findIdx(WEIGHT_ARR, weight, DEFAULT_WEIGHT_IDX));
  const [targetIdx, setTargetIdx] = useState(() => findIdx(WEIGHT_ARR, targetWeight, DEFAULT_TARGET_IDX));

  const [activeField, setActiveField] = useState<FieldKey | null>(null);

  // Seed store with picker defaults so canProceed works without touching pickers
  useEffect(() => {
    if (!age) setField("age", AGE_ARR[DEFAULT_AGE_IDX]);
    if (!height) setField("height", HEIGHT_ARR[DEFAULT_HEIGHT_IDX]);
    if (!weight) setField("weight", WEIGHT_ARR[DEFAULT_WEIGHT_IDX]);
    if (!targetWeight) setField("targetWeight", WEIGHT_ARR[DEFAULT_TARGET_IDX]);
  }, []);

  // Full width minus horizontal padding, with some breathing room
  const pickerWidth = width - 64;

  function canProceed() {
    return name.trim().length > 0;
  }

  function toggleField(key: FieldKey) {
    setActiveField((prev) => (prev === key ? null : key));
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Reanimated.View entering={FadeInDown.springify()}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← VOLTAR</Text>
          </Pressable>

          {/* Progress */}
          <View style={styles.progress}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={[styles.dot, n <= 3 && styles.dotActive]} />
            ))}
          </View>

          <Text style={styles.step}>PASSO 3 DE 4</Text>
          <Text style={styles.title}>Seus dados pessoais</Text>
          <Text style={styles.subtitle}>
            Para calcular suas metas com precisão, precisamos de algumas informações.
          </Text>

          {/* Nome */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>NOME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => setField("name", v)}
              placeholder="Como quer ser chamado?"
              placeholderTextColor={Colors.t4}
              autoCapitalize="words"
            />
          </View>

          {/* Sexo */}
          <View style={[styles.fieldGroup, { marginTop: 28 }]}>
            <Text style={styles.label}>SEXO</Text>
            <View style={styles.genderRow}>
              {(["M", "F"] as Sex[]).map((g) => (
                <Pressable
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g === "M" ? "Masculino" : "Feminino"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Divider before numeric fields */}
          <View style={styles.sectionDivider} />

          {/* Idade */}
          <PickerField
            fieldKey="age"
            label="IDADE"
            unit="anos"
            items={AGE_ARR}
            selectedIndex={ageIdx}
            displayValue={AGE_ARR[ageIdx]}
            pickerWidth={pickerWidth}
            isOpen={activeField === "age"}
            onToggle={toggleField}
            onChange={(idx) => {
              setAgeIdx(idx);
              setField("age", AGE_ARR[idx]);
            }}
          />

          {/* Altura */}
          <PickerField
            fieldKey="height"
            label="ALTURA"
            unit="cm"
            items={HEIGHT_ARR}
            selectedIndex={heightIdx}
            displayValue={HEIGHT_ARR[heightIdx]}
            pickerWidth={pickerWidth}
            isOpen={activeField === "height"}
            onToggle={toggleField}
            onChange={(idx) => {
              setHeightIdx(idx);
              setField("height", HEIGHT_ARR[idx]);
            }}
          />

          {/* Peso atual */}
          <PickerField
            fieldKey="weight"
            label="PESO ATUAL"
            unit="kg"
            items={WEIGHT_ARR}
            selectedIndex={weightIdx}
            displayValue={WEIGHT_ARR[weightIdx]}
            pickerWidth={pickerWidth}
            isOpen={activeField === "weight"}
            onToggle={toggleField}
            onChange={(idx) => {
              setWeightIdx(idx);
              setField("weight", WEIGHT_ARR[idx]);
            }}
          />

          {/* Peso alvo */}
          <PickerField
            fieldKey="targetWeight"
            label="PESO ALVO"
            unit="kg"
            items={WEIGHT_ARR}
            selectedIndex={targetIdx}
            displayValue={WEIGHT_ARR[targetIdx]}
            pickerWidth={pickerWidth}
            isOpen={activeField === "targetWeight"}
            onToggle={toggleField}
            onChange={(idx) => {
              setTargetIdx(idx);
              setField("targetWeight", WEIGHT_ARR[idx]);
            }}
          />

          <Pressable
            style={[styles.btn, !canProceed() && styles.btnDisabled]}
            onPress={() => canProceed() && router.push("/(onboarding)/results")}
          >
            <Text style={styles.btnText}>PRÓXIMO →</Text>
          </Pressable>
        </Reanimated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { paddingHorizontal: 32, paddingTop: 64, paddingBottom: 40 },
  backBtn: { marginBottom: 28 },
  backText: { fontFamily: fonts.sansLight, fontSize: fontSizes.xs, color: Colors.t3, letterSpacing: 2 },

  progress: { flexDirection: "row", gap: 8, marginBottom: 32 },
  dot: { width: 24, height: 2, backgroundColor: Colors.b2 },
  dotActive: { backgroundColor: Colors.gold },

  step: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes["3xl"],
    color: Colors.t1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
    lineHeight: 20,
    marginBottom: 36,
  },

  fieldGroup: {
    gap: 8,
  },

  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: Colors.t3,
    letterSpacing: 2,
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.b2,
    paddingVertical: 12,
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.md,
    color: Colors.t1,
  },

  genderRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.b1,
    alignItems: "center",
  },
  genderBtnActive: { borderColor: Colors.t1 },
  genderText: { fontFamily: fonts.sansLight, fontSize: fontSizes.sm, color: Colors.t3 },
  genderTextActive: { color: Colors.t1 },

  sectionDivider: {
    height: 1,
    backgroundColor: Colors.b1,
    marginTop: 36,
    marginBottom: 8,
  },

  // Tappable picker row
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b2,
  },
  pickerRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pickerValue: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.md,
    color: Colors.t2,
  },
  pickerValueActive: {
    color: Colors.gold,
  },
  pickerUnit: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t3,
    letterSpacing: 1,
  },
  pickerUnitActive: {
    color: `${Colors.gold}99`,
  },
  chevron: {
    fontFamily: fonts.sansLight,
    fontSize: 18,
    color: Colors.t3,
    marginLeft: 10,
    lineHeight: 22,
    // rotate via transform in component
  },

  // Animated collapsible container
  pickerWrapper: {
    overflow: "hidden",
  },
  pickerInner: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: Colors.c1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.b1,
  },

  btn: {
    borderWidth: 1,
    borderColor: Colors.t1,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 40,
  },
  btnDisabled: { borderColor: Colors.b1, opacity: 0.4 },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t1,
    letterSpacing: 3,
  },
});
