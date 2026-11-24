import { Tabs, useRouter, useSegments } from "expo-router";
import {
  Basketball,
  ListBullets,
  Ranking,
  UsersThree,
} from "phosphor-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LeagueSwitcher from "@/components/LeagueSwitcher";
import { useAppSelector } from "@/state/hooks";
import { selectCurrentLeague } from "@/state/slices/leagueSlice";

const HomeLayout = () => {
  const router = useRouter();
  const segments = useSegments();
  // A null current league means the user is in Ranked mode
  const isRanked = useAppSelector(selectCurrentLeague) === null;
  const isOnLeaderboard = segments.at(-1) === "leaderboard";

  // The Leaderboard tab is hidden in Ranked mode, so don't leave the user
  // stranded on it after switching from a league to Ranked
  useEffect(() => {
    if (isRanked && isOnLeaderboard) {
      router.replace("/(protected)/(tabs)");
    }
  }, [isRanked, isOnLeaderboard, router]);

  return (
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
        {/* League standings only, so hidden in Ranked mode */}
        <Tabs.Screen
          name="leaderboard"
          options={{
            href: isRanked ? null : "/(protected)/(tabs)/leaderboard",
            title: "Leaderboard",
            tabBarIcon: ({ color }) => <Ranking color={color as string} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default HomeLayout;
