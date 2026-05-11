import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";
import { cancelAllReminders, requestPermission, scheduleMealReminder } from "@/services/notifications";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { UserProfile } from "@/types";

type ToggleField = "compassion_mode" | "nutrition_memory" | "adaptive_goals";
type ReminderPatch = Pick<UserProfile, "reminder_lunch_hour" | "reminder_dinner_hour" | "reminders_enabled">;

function formatHour(value: number | undefined, fallback: number): string {
  const hour = Number.isFinite(value ?? Number.NaN) ? Math.trunc(value ?? fallback) : fallback;
  return String(Math.min(23, Math.max(0, hour)));
}

function parseHourInput(value: string, fallback: number): number {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return fallback;
  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(23, Math.max(0, parsed));
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user, profile, setProfile } = useAuthStore();

  const [compassion, setCompassion] = useState(profile?.compassion_mode ?? false);
  const [memory, setMemory] = useState(profile?.nutrition_memory ?? false);
  const [adaptive, setAdaptive] = useState(profile?.adaptive_goals ?? false);
  const [remindersEnabled, setRemindersEnabled] = useState(profile?.reminders_enabled ?? false);
  const [lunchHour, setLunchHour] = useState(formatHour(profile?.reminder_lunch_hour, 12));
  const [dinnerHour, setDinnerHour] = useState(formatHour(profile?.reminder_dinner_hour, 19));
  const [savingReminders, setSavingReminders] = useState(false);

  useEffect(() => {
    setCompassion(profile?.compassion_mode ?? false);
    setMemory(profile?.nutrition_memory ?? false);
    setAdaptive(profile?.adaptive_goals ?? false);
    setRemindersEnabled(profile?.reminders_enabled ?? false);
    setLunchHour(formatHour(profile?.reminder_lunch_hour, 12));
    setDinnerHour(formatHour(profile?.reminder_dinner_hour, 19));
  }, [profile]);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((notification) => {
      console.log("notification_received", notification.request.content.data);
    });

    const response = Notifications.addNotificationResponseReceivedListener((notificationResponse) => {
      console.log("notification_opened", notificationResponse.notification.request.content.data);
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, []);

  async function updateProfilePatch(patch: Partial<ReminderPatch> & Partial<Pick<UserProfile, ToggleField>>): Promise<boolean> {
    if (!user) return false;

    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
      return false;
    }

    if (profile) {
      setProfile({ ...profile, ...patch });
    }

    return true;
  }

  async function persistBehaviorToggle(field: ToggleField, value: boolean): Promise<void> {
    await updateProfilePatch({ [field]: value } as Partial<Pick<UserProfile, ToggleField>>);
  }

  async function syncMealReminders(enabled: boolean, lunch: number, dinner: number): Promise<void> {
    await cancelAllReminders();
    if (!enabled) return;

    await requestPermission();
    await scheduleMealReminder(lunch, 0);
    await scheduleMealReminder(dinner, 0);
  }

  async function handleReminderToggle(value: boolean): Promise<void> {
    if (!user) return;
    setSavingReminders(true);

    const previous = remindersEnabled;
    setRemindersEnabled(value);

    const persisted = await updateProfilePatch({
      reminders_enabled: value,
      reminder_lunch_hour: parseHourInput(lunchHour, 12),
      reminder_dinner_hour: parseHourInput(dinnerHour, 19),
    });
    if (!persisted) {
      setRemindersEnabled(previous);
      setSavingReminders(false);
      return;
    }

    try {
      await syncMealReminders(value, parseHourInput(lunchHour, 12), parseHourInput(dinnerHour, 19));
    } catch (error: unknown) {
      setRemindersEnabled(previous);
      await updateProfilePatch({ reminders_enabled: previous });
      Alert.alert("Lembretes", getErrorMessage(error, "Não foi possível atualizar os lembretes."));
    } finally {
      setSavingReminders(false);
    }
  }

  async function handleMealHoursCommit(nextLunch: string, nextDinner: string): Promise<void> {
    if (!user) return;

    const lunch = parseHourInput(nextLunch, 12);
    const dinner = parseHourInput(nextDinner, 19);

    const persisted = await updateProfilePatch({
      reminder_lunch_hour: lunch,
      reminder_dinner_hour: dinner,
    });
    if (!persisted) return;

    if (!remindersEnabled) return;

    try {
      await syncMealReminders(true, lunch, dinner);
    } catch (error: unknown) {
      Alert.alert("Lembretes", getErrorMessage(error, "Não foi possível atualizar os lembretes."));
    }
  }

  function handleSignOut(): void {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: signOut },
    ]);
  }

  async function handleDeleteAccount(): Promise<void> {
    Alert.alert(
      "Excluir conta",
      "Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Confirmar exclusão",
              "Digite sua confirmação. Esta ação não pode ser desfeita.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "EXCLUIR PERMANENTEMENTE",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await (supabase as any).rpc("delete_user_data", { uid: user!.id });
                      await signOut();
                    } catch (error: unknown) {
                      Alert.alert("Erro", getErrorMessage(error, "Não foi possível excluir a conta."));
                    }
                  },
                },
              ]
            ),
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.headerTitle}>← S I S T E M A</Text>
          </Pressable>
          <Text style={styles.headerVersion}>v2.0</Text>
        </View>

        {/* SEÇÃO NOTIFICAÇÕES */}
        <Text style={styles.sectionLabel}>NOTIFICAÇÕES</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Ativar lembretes</Text>
              <Text style={styles.rowHint}>Registro anti-shame de refeições</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={() => { void handleReminderToggle(!remindersEnabled); }}
              disabled={savingReminders}
              trackColor={{ false: '#2A2840', true: '#6B5FE4' }}
              thumbColor={'#EBE4D2'}
            />
          </View>
        </View>

        {/* SEÇÃO PRIVACIDADE */}
        <Text style={styles.sectionLabel}>PRIVACIDADE</Text>
        <View style={styles.card}>
          {[
            { label: 'Exportar meus dados', onPress: () => router.push('/(modals)/privacy-policy' as any) },
            { label: 'Revogar consentimento', onPress: () => router.push('/(modals)/privacy-policy' as any) },
          ].map((item, i, arr) => (
            <Pressable
              key={item.label}
              style={[styles.row, i < arr.length - 1 && styles.rowBorder]}
              onPress={item.onPress}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* SEÇÃO COMPORTAMENTO */}
        <Text style={styles.sectionLabel}>COMPORTAMENTO</Text>
        <View style={styles.card}>
          {[
            { label: 'Modo Compaixão', value: compassion, onToggle: () => { setCompassion(!compassion); void persistBehaviorToggle('compassion_mode', !compassion); } },
            { label: 'Memória Nutricional', value: memory, onToggle: () => { setMemory(!memory); void persistBehaviorToggle('nutrition_memory', !memory); } },
            { label: 'Metas Adaptativas', value: adaptive, onToggle: () => { setAdaptive(!adaptive); void persistBehaviorToggle('adaptive_goals', !adaptive); } },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: '#2A2840', true: '#6B5FE4' }}
                thumbColor={'#EBE4D2'}
              />
            </View>
          ))}
        </View>

        {/* SEÇÃO LEMBRETES */}
        <Text style={styles.sectionLabel}>LEMBRETES</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Almoço</Text>
              <Text style={styles.rowHint}>Hora diária</Text>
            </View>
            <View style={styles.hourWrap}>
              <TextInput
                style={styles.hourInput}
                value={lunchHour}
                onChangeText={(t) => setLunchHour(t.replace(/[^0-9]/g, '').slice(0, 2))}
                onBlur={() => { void handleMealHoursCommit(lunchHour, dinnerHour); }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="12"
                placeholderTextColor={'#4A4860'}
              />
              <Text style={styles.hourSuffix}>h</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Jantar</Text>
              <Text style={styles.rowHint}>Hora diária</Text>
            </View>
            <View style={styles.hourWrap}>
              <TextInput
                style={styles.hourInput}
                value={dinnerHour}
                onChangeText={(t) => setDinnerHour(t.replace(/[^0-9]/g, '').slice(0, 2))}
                onBlur={() => { void handleMealHoursCommit(lunchHour, dinnerHour); }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="19"
                placeholderTextColor={'#4A4860'}
              />
              <Text style={styles.hourSuffix}>h</Text>
            </View>
          </View>
        </View>

        {/* SEÇÃO CONTA */}
        <Text style={styles.sectionLabel}>CONTA</Text>
        <View style={{ gap: 12 }}>
          {/* Botão MEU PERFIL */}
          <Pressable
            style={{ backgroundColor: '#12121F', borderWidth: 0.5, borderColor: '#2A2840', borderRadius: 6, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            <Text style={styles.signOutText}>MEU PERFIL</Text>
            <Text style={{ fontFamily: fonts.sansLight, fontSize: 18, color: '#8A8070' }}>›</Text>
          </Pressable>

          {/* Botão SAIR — C2 bg, B1 border */}
          <Pressable
            style={styles.signOutBtn}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>SAIR DA CONTA</Text>
          </Pressable>

          {/* EXCLUIR CONTA — ERR 0.5 opacity + label */}
          <Pressable onPress={() => { void handleDeleteAccount(); }}>
            <Text style={styles.deleteText}>EXCLUIR CONTA</Text>
            <Text style={styles.deleteHint}>AÇÃO IRREVERSÍVEL</Text>
          </Pressable>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>PRAXIS · GROQ · GEMINI · SUPABASE</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07070D' },
  inner: { paddingHorizontal: 20, paddingBottom: 60 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontFamily: fonts.serifLight, fontSize: 20, color: '#EBE4D2', letterSpacing: 6 },
  headerVersion: { fontFamily: fonts.monoRegular, fontSize: 14, color: '#8A8070' },

  sectionLabel: { fontFamily: fonts.sansRegular, fontSize: 10, color: '#8A8070', letterSpacing: 2, marginBottom: 8, marginTop: 24 },

  card: { backgroundColor: '#0D0D17', borderWidth: 0.5, borderColor: '#2A2840', borderRadius: 12, overflow: 'hidden' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#2A2840' },
  rowLeft: { flex: 1, paddingRight: 12 },
  rowLabel: { fontFamily: fonts.sansRegular, fontSize: 13, color: '#EBE4D2' },
  rowHint: { fontFamily: fonts.sansLight, fontSize: 11, color: '#8A8070', marginTop: 2 },
  rowArrow: { fontSize: 20, color: '#4A4860' },

  hourWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12121F', borderWidth: 0.5, borderColor: '#2A2840', borderRadius: 8, paddingHorizontal: 12 },
  hourInput: { width: 44, paddingVertical: 10, fontFamily: fonts.monoLight, fontSize: 15, color: '#EBE4D2', textAlign: 'center' },
  hourSuffix: { fontFamily: fonts.sansLight, fontSize: 11, color: '#8A8070', marginLeft: 4 },

  signOutBtn: { backgroundColor: '#12121F', borderWidth: 0.5, borderColor: '#2A2840', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  signOutText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#EBE4D2', letterSpacing: 2 },

  deleteText: { fontFamily: fonts.sansRegular, fontSize: 11, color: '#7A2D2D', opacity: 0.5, textAlign: 'center', letterSpacing: 2 },
  deleteHint: { fontFamily: fonts.sansLight, fontSize: 9, color: '#7A2D2D', textAlign: 'center', letterSpacing: 2, marginTop: 2, opacity: 0.5 },

  footer: { fontFamily: fonts.sansLight, fontSize: 9, color: '#4A4860', textAlign: 'center', letterSpacing: 2, marginTop: 40 },
});
