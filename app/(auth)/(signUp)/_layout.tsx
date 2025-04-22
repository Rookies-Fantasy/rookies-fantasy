import { SignUpFormProvider } from "@/components/SignUpProvider";
import { Stack } from "expo-router";

export default function SignUpLayout() {
  return (
    <SignUpFormProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      >
        <Stack.Screen name="signUp" />
        <Stack.Screen name="createProfile" />
      </Stack>
    </SignUpFormProvider>
  );
}
