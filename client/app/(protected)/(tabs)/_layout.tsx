import { Tabs } from "expo-router";
import { House, IdentificationBadge } from "phosphor-react-native";

const MainLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarIconStyle: {
        flex: 1,
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
      name="(myTeam)"
      options={{
        title: "My Team",
        tabBarIcon: ({ color }) => <IdentificationBadge color={color} />,
      }}
    />
  </Tabs>
);

export default MainLayout;
