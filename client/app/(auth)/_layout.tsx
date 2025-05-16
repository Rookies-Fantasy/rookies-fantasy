import { Redirect, Stack, useSegments } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import {
  selectIsRegistered,
  selectIsUserSignedIn,
} from "@/state/slices/userSlice";

const AuthLayout = () => {
  const isSignedIn = useAppSelector(selectIsUserSignedIn);
  const isRegistered = useAppSelector(selectIsRegistered);
  const segments = useSegments();

  const currentRoute = segments[segments.length - 1];
  const isOnCreateProfile = currentRoute === "createProfile";

  if (isSignedIn && !isRegistered && !isOnCreateProfile) {
    return <Redirect href="/(auth)/createProfile" />;
  }

  if (isSignedIn && isRegistered) {
    return <Redirect href="/(protected)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="createProfile" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="confirmReset" />
    </Stack>
  );
};

export default AuthLayout;
