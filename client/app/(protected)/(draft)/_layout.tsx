import { Stack } from "expo-router";

const AugmentLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      animation: "default",
    }}
  >
    <Stack.Screen name="augments" />
    <Stack.Screen name="(teamBuilder)" />
  </Stack>
);

export default AugmentLayout;
