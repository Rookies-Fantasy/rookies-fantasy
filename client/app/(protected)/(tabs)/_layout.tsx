import { Tabs } from "expo-router";
import { House, IdentificationBadge } from "phosphor-react-native";

const AppLayout = () => (
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
      name="(profile)"
      options={{
        title: "Profile",
        tabBarIcon: ({ color }) => <IdentificationBadge color={color} />,
      }}
    />
  </Tabs>
);

export default AppLayout;
