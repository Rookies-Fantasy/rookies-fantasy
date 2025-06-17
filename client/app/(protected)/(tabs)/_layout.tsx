import { Redirect, Tabs } from "expo-router";
import { House, UserSquare } from "phosphor-react-native";
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
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#6336F5",
        tabBarIconStyle: {
          flex: 1,
        },
        tabBarStyle: {
          backgroundColor: "#0A0D12",
          borderTopColor: "#181D27",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <House color={color} />,
        }}
      />
      <Tabs.Screen
        name="myTeam"
        options={{
          title: "My Team",
          tabBarIcon: ({ color }) => <UserSquare color={color} />,
        }}
      />
    </Tabs>
  );
};

export default AppLayout;
