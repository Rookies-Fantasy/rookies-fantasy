import { Stack } from "expo-router";

const HomeLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      animation: "default",
    }}
  >
    <Stack.Screen name="applyAugment" />
  </Stack>
);

export default HomeLayout;
