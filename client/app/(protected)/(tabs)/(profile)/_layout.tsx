import { Tabs } from "expo-router";
import {
  ChartBar,
  ClockCounterClockwise,
  ListBullets,
  Ranking,
  UsersThree,
} from "phosphor-react-native";

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
        title: "Roaster",
        tabBarIcon: ({ color }) => <UsersThree color={color} />,
      }}
    />
    <Tabs.Screen
      name="arena"
      options={{
        title: "Arena",
        tabBarIcon: ({ color }) => <ChartBar color={color} />,
      }}
    />
    <Tabs.Screen
      name="matchHistory"
      options={{
        title: "Match History",
        tabBarIcon: ({ color }) => <ClockCounterClockwise color={color} />,
      }}
    />
    <Tabs.Screen
      name="players"
      options={{
        title: "Players",
        tabBarIcon: ({ color }) => <ListBullets color={color} />,
      }}
    />
    <Tabs.Screen
      name="leaderboard"
      options={{
        title: "Leaderboard",
        tabBarIcon: ({ color }) => <Ranking color={color} />,
      }}
    />
  </Tabs>
);

export default ProfileLayout;
