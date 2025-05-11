import { Redirect, Tabs, useLocalSearchParams } from "expo-router";

const ProtectedLayout = () => {
  const { loggedIn } = useLocalSearchParams();

  if (!loggedIn) {
    return <Redirect href="./(auth)" />;
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
};

export default ProtectedLayout;
