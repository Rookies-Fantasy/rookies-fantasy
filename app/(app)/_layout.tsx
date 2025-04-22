import { useAppSelector } from "@/state/hooks";
import { selectCurrentUserId } from "@/state/slices/userSlice";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const isSignedIn = useAppSelector(selectCurrentUserId);

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
