import { useEffect } from "react";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ActivityLevel } from "@/types";

export function useAuth() {
  const { session, user, profile, isLoading, setSession, setProfile, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          await loadProfile(session.user.id);
        } else {
          reset();
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data && !error) {
        setProfile({
          id: data.user_id,
          email: data.email ?? "",
          name: data.full_name ?? data.name ?? "",
          age: data.age ?? 0,
          height_cm: data.height ?? data.height_cm ?? 0,
          weight_kg: data.weight ?? data.weight_kg ?? 0,
          target_weight_kg: data.target_weight_kg ?? 0,
          gender: (data.gender ?? "M") as "M" | "F",
          activity_level: String(data.activity_level ?? "1.55") as ActivityLevel,
          goal: (data.goal ?? "maintain") as "lose_weight" | "gain_muscle" | "maintain",
          avatar_url: data.avatar_url ?? undefined,
          created_at: data.created_at ?? "",
          // v3 fields
          calories_target:   data.calories_target   ?? 2100,
          protein_target:    data.protein_target    ?? 150,
          hydration_target:  data.hydration_target  ?? 2000,
          compassion_mode:   data.compassion_mode   ?? true,
          quiet_intelligence: data.quiet_intelligence ?? true,
          adaptive_goals:    data.adaptive_goals    ?? false,
          nutrition_memory:  data.nutrition_memory  ?? true,
          reminder_lunch_hour: data.reminder_lunch_hour ?? 12,
          reminder_dinner_hour: data.reminder_dinner_hour ?? 19,
          reminders_enabled: data.reminders_enabled ?? false,
        });
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Nenhuma sessão retornada. Verifique suas credenciais.");
    return data;
  }

  async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/(auth)/login`
            : undefined,
      },
    });
    if (error) throw new Error(error.message);
    if (data.user && !data.session) {
      throw new Error("Conta criada! Verifique seu email para confirmar antes de fazer login.");
    }
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    reset();
    router.replace("/(auth)");
  }

  return {
    session,
    user,
    profile,
    isLoading,
    signInWithEmail,
    signUp,
    signOut,
  };
}
