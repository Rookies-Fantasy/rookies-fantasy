import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import {
  selectIsUserSignedIn,
  selectIsUserVerified,
} from "@/state/slices/userSlice";

const AuthLayout = () => {
  const isUserSignedIn = useAppSelector(selectIsUserSignedIn);
  const isUserVerified = useAppSelector(selectIsUserVerified);

  if (isUserSignedIn && isUserVerified) {
    return <Redirect href="/(protected)/createProfile" />;
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
