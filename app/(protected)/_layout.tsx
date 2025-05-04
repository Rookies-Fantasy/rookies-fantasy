import { Redirect, Tabs, useLocalSearchParams } from "expo-router";

export default function ProtectedLayout() {
  const { loggedIn } = useLocalSearchParams();

  if (!loggedIn) {
    return <Redirect href="./(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
    </Tabs>
  );
}
