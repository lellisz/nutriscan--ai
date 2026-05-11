import "../global.css";
import "react-native-url-polyfill/auto";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, router, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import {
  DMSans_300Light,
  DMSans_400Regular,
} from "@expo-google-fonts/dm-sans";
import {
  Jost_200ExtraLight,
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium,
} from "@expo-google-fonts/jost";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  const { isLoading, session, profile, hasCompletedOnboarding } = useAuthStore();
  const segments = useSegments();

  // Inicializa listener de auth
  useAuth();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (session && !profile && !hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace("/(onboarding)/consent");
    } else if (session && profile && (inAuthGroup || inOnboardingGroup)) {
      router.replace("/(tabs)");
    }
    // NOTE: `segments` is intentionally excluded from the dependency array.
    // useSegments() returns a new array reference on every render, which would
    // cause this effect to re-fire during route transitions and redirect the
    // user back to personal.tsx mid-navigation. Auth state changes (isLoading,
    // session, profile) are the only meaningful triggers for routing decisions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, session, profile, hasCompletedOnboarding]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    DMSans_300Light,
    DMSans_400Regular,
    Jost_200ExtraLight,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
  });
  const [ready, setReady] = useState(Platform.OS === "web");

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (Platform.OS !== "web") SplashScreen.hideAsync();
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Fallback nativo: se fontes demorarem mais de 3s, renderiza mesmo assim
  useEffect(() => {
    if (Platform.OS === "web") return;
    const t = setTimeout(() => {
      SplashScreen.hideAsync();
      setReady(true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
