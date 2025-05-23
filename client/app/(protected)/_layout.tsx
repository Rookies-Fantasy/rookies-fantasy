import { Redirect, Tabs } from "expo-router";
import { useAppSelector } from "@/state/hooks";
import { selectUserId, selectIsUserRegistered } from "@/state/slices/userSlice";

const AppLayout = () => {
  const isSignedIn = useAppSelector(selectUserId);
  const isRegistered = useAppSelector(selectIsUserRegistered);

  if (isSignedIn && !isRegistered) {
    return <Redirect href="/(auth)/createProfile" />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
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

export default AppLayout;
