import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import {
  selectIsUserSignedIn,
  selectIsUserVerified,
} from "@/state/slices/userSlice";

const AuthLayout = () => {
  const isUserSignedIn = useAppSelector(selectIsUserSignedIn);
  const isUserVerified = useAppSelector(selectIsUserVerified);

<<<<<<< HEAD
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
    return <Redirect href="/(protected)/(tabs)" />;
=======
  if (isUserSignedIn && isUserVerified) {
    return <Redirect href="/(protected)/createProfile" />;
>>>>>>> 15541e4c674e51b784a4a39e04f1a7a9aead8f18
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
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="confirmReset" />
      <Stack.Screen name="emailVerification" />
    </Stack>
  );
};

export default AuthLayout;
