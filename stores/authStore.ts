import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { UserProfile } from "@/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setProfile: (profile) =>
    set({ profile, hasCompletedOnboarding: !!profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasCompletedOnboarding: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),
  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      hasCompletedOnboarding: false,
    }),
}));
