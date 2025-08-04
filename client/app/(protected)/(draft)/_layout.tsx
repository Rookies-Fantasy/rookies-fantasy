import { Tabs } from "expo-router";
import { UserPlus, UsersThree } from "phosphor-react-native";

const DraftLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      animation: "none",
      tabBarActiveTintColor: "#6336F5",
      tabBarIconStyle: {
        flex: 1,
      },
      tabBarStyle: {
        backgroundColor: "#0A0D12",
        borderTopColor: "#373843",
        borderTopWidth: 1,
      },
      tabBarLabelStyle: {
        fontSize: 12,
      },
    }}
  >
    <Tabs.Screen
      name="roster"
      options={{
        title: "ROSTER",
        tabBarIcon: ({ color }) => <UsersThree color={color} />,
      }}
    />
    <Tabs.Screen
      name="players"
      options={{
        title: "ADD PLAYERS",
        tabBarIcon: ({ color }) => <UserPlus color={color} />,
      }}
    />
  </Tabs>
);

export default DraftLayout;
