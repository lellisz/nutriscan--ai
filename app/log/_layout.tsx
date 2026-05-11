import { Stack } from "expo-router";

export default function LogLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="voice" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
