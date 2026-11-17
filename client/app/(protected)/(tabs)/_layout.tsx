import { Tabs } from "expo-router";
import { Basketball, ListBullets, UsersThree } from "phosphor-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LeagueSwitcher from "@/components/LeagueSwitcher";

const HomeLayout = () => (
  <SafeAreaView className="flex-1" edges={["top"]}>
    <View className="items-center bg-gray-950">
      <LeagueSwitcher />
    </View>

    <Tabs
      safeAreaInsets={{ top: 0, bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarPosition: "top",
        tabBarStyle: {
          backgroundColor: "#0A0D12", // bg-gray-920
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Team",
          tabBarIcon: ({ color }) => <UsersThree color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="arena"
        options={{
          title: "Arena",
          tabBarIcon: ({ color }) => <Basketball color={color as string} />,
        }}
      />
      {/* Hidden from the tab bar until the Match History feature ships */}
      <Tabs.Screen name="matchHistory" options={{ href: null }} />
      <Tabs.Screen
        name="freeAgents"
        options={{
          title: "Free Agents",
          tabBarIcon: ({ color }) => <ListBullets color={color as string} />,
        }}
      />
      {/* Hidden from the tab bar until the Leaderboard feature ships */}
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
    </Tabs>
  </SafeAreaView>
);

export default HomeLayout;
