import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="createProfile" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="confirmReset" />
    </Stack>
  );
}
