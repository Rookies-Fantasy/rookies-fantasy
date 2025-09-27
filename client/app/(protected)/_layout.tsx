import { Stack } from "expo-router";
import { QueueListener } from "@/components/QueueListener";
import { useAppSelector } from "@/state/hooks";
import { selectIsTeamRegistered } from "@/state/slices/teamSlice";
import { selectIsUserRegistered } from "@/state/slices/userSlice";

const ProtectedLayout = () => {
  const isUserRegistered = useAppSelector(selectIsUserRegistered);
  const isTeamRegistered = useAppSelector(selectIsTeamRegistered);

  return (
    <QueueListener>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isUserRegistered || !isTeamRegistered}>
          <Stack.Screen name="createProfile" />
        </Stack.Protected>
        <Stack.Protected guard={isUserRegistered && !isTeamRegistered}>
          <Stack.Screen name="createTeam" />
        </Stack.Protected>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(draft)" />
      </Stack>
    </QueueListener>
  );
};

export default ProtectedLayout;
