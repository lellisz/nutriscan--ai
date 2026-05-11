import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      initialRouteName="consent"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="consent" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="personal" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
