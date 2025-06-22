import { Tabs } from "expo-router";

const AppLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      animation: "none",
    }}
  >
    <Tabs.Screen name="index" options={{ title: "Home" }} />
  </Tabs>
);

export default AppLayout;
