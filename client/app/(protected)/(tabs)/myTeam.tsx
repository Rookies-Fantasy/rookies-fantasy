import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import PlayerRoster from "@/components/PlayerRoster";
import RosterDrawer from "@/components/RosterDrawer";
import TeamActionButtons from "@/components/TeamActionButtons";
import { useAppSelector } from "@/state/hooks";
import { SlotPosition } from "@/types/teamTypes";

const MyTeam = () => {
  const router = useRouter();
  const team = useAppSelector((state) => state.team);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<SlotPosition | null>(
    null,
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView
        contentContainerClassName={team.hasUserChanges ? "pb-10" : ""}
      >
        <View className="h-[200px] w-full">
          <View className="h-1/2 bg-pink-700" />
          <View className="h-1/2 border-b border-gray-900 bg-gray-950">
            <View className="top-0 w-full -translate-y-1/2 flex-row justify-between px-8">
              <View className="h-[70px] w-[50px] rounded-full bg-orange-700"></View>
              <View className="h-[50px] w-[200px] rounded-md border-gray-900 bg-gray-920"></View>
            </View>
            <View className="w-full flex-row items-center justify-between px-8">
              <Text className="pbk-h5 text-white">Team Name</Text>
              <Pressable className="rounded-md border border-purple-800">
                <Text className="pbk-h8 p-3 text-white">Edit</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <Pressable
          className="min-h-12 w-full items-center justify-center rounded-md bg-purple-600"
          onPress={() => router.push("/(protected)/(draft)/roster")}
        >
          <Text className="pbk-h6 text-center text-base-white">
            Draft Players
          </Text>
        </Pressable>
        <View className="mx-6 my-2 flex-1 gap-4">
          <PlayerRoster
            bench={team.bench}
            enableActionIcon
            isCard
            lineup={team.lineup}
            setSelectedPosition={setSelectedPosition}
            setShowBottomDrawer={() => setShowBottomDrawer(true)}
          />
        </View>
      </ScrollView>
      <TeamActionButtons />
      <RosterDrawer
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        setShowBottomDrawer={setShowBottomDrawer}
        showBottomDrawer={showBottomDrawer}
      />
    </SafeAreaView>
  );
};

export default MyTeam;
