import { useAppSelector } from "@/state/hooks";
import {
  selectCurrentUserId,
  selectIsRegistered,
} from "@/state/slices/userSlice";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const isSignedIn = useAppSelector(selectCurrentUserId);
  const isRegistered = useAppSelector(selectIsRegistered);

  if (isSignedIn && !isRegistered) {
    return <Redirect href={"/(auth)/createProfile"} />;
  }

  if (!isSignedIn) {
    return <Redirect href={"/(auth)"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
