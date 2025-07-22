import { Stack } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import { selectIsTeamRegistered } from "@/state/slices/teamSlice";
import { selectIsUserRegistered } from "@/state/slices/userSlice";

const ProtectedLayout = () => {
  const isUserRegistered = useAppSelector(selectIsUserRegistered);
  const isTeamRegistered = useAppSelector(selectIsTeamRegistered);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isUserRegistered || !isTeamRegistered}>
        <Stack.Screen name="createProfile" />
        <Stack.Screen name="createTeam" />
      </Stack.Protected>
      <Stack.Protected guard={isUserRegistered && isTeamRegistered}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
};

export default ProtectedLayout;
