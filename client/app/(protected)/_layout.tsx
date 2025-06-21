import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import {
  selectCurrentUserId,
  selectIsUserRegistered,
} from "@/state/slices/userSlice";

const AppLayout = () => {
  const isSignedIn = useAppSelector(selectCurrentUserId);
  const isRegistered = useAppSelector(selectIsUserRegistered);

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (isSignedIn && !isRegistered) {
    return <Redirect href="/(auth)/createProfile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(draft)" />
    </Stack>
  );
};

export default AppLayout;
