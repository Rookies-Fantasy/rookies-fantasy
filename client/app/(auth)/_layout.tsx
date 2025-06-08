import { Redirect, Stack, useSegments } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import { selectIsTeamRegistered } from "@/state/slices/teamSlice";
import {
  selectIsUserRegistered,
  selectIsUserSignedIn,
  selectIsUserVerified,
} from "@/state/slices/userSlice";

const AuthLayout = () => {
  const isUserSignedIn = useAppSelector(selectIsUserSignedIn);
  const isUserRegistered = useAppSelector(selectIsUserRegistered);
  const isUserVerified = useAppSelector(selectIsUserVerified);
  const isTeamRegistered = useAppSelector(selectIsTeamRegistered);
  const segments = useSegments();

  const currentRoute = segments[segments.length - 1];
  const isOnCreateProfile = currentRoute === "createProfile";
  const isOnEmailVerification = currentRoute === "emailVerification";
  const isOnCreateTeam = currentRoute === "createTeam";

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

  if (
    isUserSignedIn &&
    isUserRegistered &&
    !isTeamRegistered &&
    !(isOnCreateTeam || isOnCreateProfile)
  ) {
    return <Redirect href="/(auth)/createTeam" />;
  }

  if (isUserSignedIn && isUserRegistered && isTeamRegistered) {
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
      <Stack.Screen name="createProfile" options={{ animation: "fade" }} />
      <Stack.Screen name="createTeam" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="confirmReset" />
    </Stack>
  );
};

export default AuthLayout;
