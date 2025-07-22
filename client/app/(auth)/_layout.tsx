import { Stack } from "expo-router";

const AuthLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      animation: "default",
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen name="login" />
    <Stack.Screen name="signUp" />
    <Stack.Screen name="forgotPassword" />
    <Stack.Screen name="confirmReset" />
    <Stack.Screen name="emailVerification" />
  </Stack>
);

export default AuthLayout;
