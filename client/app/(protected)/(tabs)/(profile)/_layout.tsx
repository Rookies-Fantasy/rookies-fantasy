import { Tabs } from "expo-router";
import { UsersThree } from "phosphor-react-native";

const ProfileLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarPosition: "top",
      tabBarActiveTintColor: "#6336F5",
      tabBarIconStyle: {
        flex: 1,
      },
      tabBarStyle: {
        backgroundColor: "#0A0D12",
        borderBottomColor: "#181D27",
      },
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title: "My Team",
        tabBarIcon: ({ color }) => <UsersThree color={color} />,
      }}
    />
  </Tabs>
);

export default ProfileLayout;
