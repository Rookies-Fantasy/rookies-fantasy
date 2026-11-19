import { Stack } from "expo-router";

const AugmentLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      animation: "default",
    }}
  >
    <Stack.Screen name="(teamBuilder)" />
    <Stack.Screen name="applyAugment" />
  </Stack>
);

export default AugmentLayout;
