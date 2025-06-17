import { Tabs } from "expo-router";
import { UserList, UsersThree } from "phosphor-react-native";

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
        borderTopColor: "#6336F5",
        borderTopWidth: 4,
      },
      tabBarLabelStyle: {
        fontSize: 12,
      },
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title: "PLAYERS",
        tabBarIcon: ({ color }) => <UserList color={color} />,
      }}
    />
    <Tabs.Screen
      name="roster"
      options={{
        title: "ROSTER",
        tabBarIcon: ({ color }) => <UsersThree color={color} />,
      }}
    />
  </Tabs>
);

export default DraftLayout;
