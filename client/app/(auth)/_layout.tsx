import { Redirect, Stack, useSegments } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import {
  selectIsUserRegistered,
  selectIsUserSignedIn,
  selectIsUserVerified,
} from "@/state/slices/userSlice";

const AuthLayout = () => {
  const isUserSignedIn = useAppSelector(selectIsUserSignedIn);
  const isUserRegistered = useAppSelector(selectIsUserRegistered);
  const isUserVerified = useAppSelector(selectIsUserVerified);
  const segments = useSegments();

  const currentRoute = segments[segments.length - 1];
  const isOnCreateProfile = currentRoute === "createProfile";
  const isOnEmailVerification = currentRoute === "emailVerification";

  if (
    isUserSignedIn &&
    !isUserVerified &&
    !isUserRegistered &&
    !isOnEmailVerification
  ) {
    return <Redirect href="/(auth)/emailVerification" />;
  }

  if (
    isUserSignedIn &&
    !isUserRegistered &&
    isUserVerified &&
    !isOnCreateProfile
  ) {
    return <Redirect href="/(auth)/createProfile" />;
  }

  if (isUserSignedIn && isUserRegistered) {
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
      <Stack.Screen name="emailVerification" />
      <Stack.Screen name="createProfile" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="confirmReset" />
    </Stack>
  );
};

export default AuthLayout;
