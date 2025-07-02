import { Tabs } from "expo-router";
import { House, UserSquare } from "phosphor-react-native";
import { useAppSelector } from "@/state/hooks";
import { selectIsTeamRegistered } from "@/state/slices/teamSlice";
import { selectIsUserRegistered } from "@/state/slices/userSlice";

const ProtectedLayout = () => {
  const isUserRegistered = useAppSelector(selectIsUserRegistered);
  const isTeamRegistered = useAppSelector(selectIsTeamRegistered);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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

export default ProtectedLayout;
