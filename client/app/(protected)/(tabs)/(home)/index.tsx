import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View, Image, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import AugmentStatusCard from "@/components/AugmentStatusCard";
import Button from "@/components/Button";
import PlayerRoster from "@/components/PlayerRoster";
import RosterDrawer from "@/components/RosterDrawer";
import TeamActionButtons from "@/components/TeamActionButtons";
import { QueueController } from "@/controllers/queueController";
import { useAppSelector } from "@/state/hooks";
import { selectIsInQueue, selectQueueStatus } from "@/state/slices/queueSlice";
import { selectAugment } from "@/state/slices/teamSlice";
import { defaultTeamLogo, teamLogoOptions } from "@/types/asset";
import { SlotPosition } from "@/types/team";
import { isNotNil } from "@/utils/jsUtils";
import { isTeamReadyForQueue } from "@/utils/teamUtils";

const MyTeam = () => {
  const router = useRouter();
  const team = useAppSelector((state) => state.team);
  const augment = useAppSelector(selectAugment);
  const isInQueue = useAppSelector(selectIsInQueue);
  const queueStatus = useAppSelector(selectQueueStatus);
  const matchedLogo = teamLogoOptions.find(
    (option) => option.url === team.logoUrl,
  );
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<SlotPosition | null>(
    null,
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);

      // Auto-join queue if team is ready and not already in queue
      const autoJoinQueue = async () => {
        if (
          isTeamReadyForQueue(team.lineup) &&
          !isInQueue &&
          !isQueueLoading &&
          team.id
        ) {
          console.log("Attempting to join queue with team ID:", team.id);
          setIsQueueLoading(true);
          try {
            await QueueController.addTeamToQueue(team.id);
            console.log("Successfully joined queue");
          } catch (error) {
            console.error("Auto queue join error:", error);
            console.error("Team ID:", team.id);
          } finally {
            setIsQueueLoading(false);
          }
        } else {
          console.log("Queue join conditions not met:", {
            teamReady: isTeamReadyForQueue(team.lineup),
            notInQueue: !isInQueue,
            notLoading: !isQueueLoading,
            hasTeamId: !!team.id,
          });
        }
      };

      autoJoinQueue();
    }, [team.lineup, isInQueue, isQueueLoading, team.id]),
  );

  const handleCancelQueue = async () => {
    setIsQueueLoading(true);
    try {
      await QueueController.removeTeamFromQueue(team.id);
      // Navigate back to team builder
      router.push("/(protected)/(draft)/(teamBuilder)/roster");
    } catch (error) {
      Alert.alert("Error", "Failed to leave queue. Please try again.");
      console.error("Queue leave error:", error);
    } finally {
      setIsQueueLoading(false);
    }
  };

  const getQueueButtonLabel = () => {
    if (isQueueLoading) return "Loading...";
    if (isInQueue) {
      if (queueStatus?.status === "matched") return "Match Found!";
      return "Cancel Queue";
    }
    return "Build Your Team";
  };

  const getQueueButtonStyle = () => {
    if (queueStatus?.status === "matched") return "bg-green-500";
    if (isInQueue) return "bg-red-500";
    return "bg-purple-500";
  };

  return (
    <SafeAreaView className="h-full w-full items-center justify-center bg-gray-950">
      <ScrollView
        // TODO: Find a better way to prevent FAB from blocking content (maybe use SafeAreaView bottom inset)
        contentContainerClassName={team.hasUserChanges ? "pb-10" : ""}
      >
        <View className="h-72 w-full">
          <View className="h-1/2 bg-pink-700" />
          <View className="h-1/2 border-b border-gray-900 bg-gray-950">
            <View className="-my-[37.5px] w-full flex-row justify-between px-8">
              <Image
                className="h-[75px] w-[75px] rounded-full border-2"
                source={matchedLogo?.source ?? defaultTeamLogo.source}
              />
              <View className="h-[75px] flex-row items-center gap-8 rounded-md border-gray-900 bg-gray-920 p-4">
                <View className="flex-row items-center gap-4">
                  <View className="h-8 w-8 bg-red-500"></View>
                  <View>
                    <Text className="text-white">Unranked</Text>
                    <Text className="text-white">0 RP</Text>
                  </View>
                </View>
                <View>
                  <View className="flex-row">
                    <Text className="text-green-500">0W </Text>
                    <Text className="text-red-500">0L</Text>
                  </View>
                  <Text className="text-right text-white">-</Text>
                </View>
              </View>
            </View>
            <View className="my-auto w-full flex-row items-center justify-between px-8 pt-[37.5px]">
              <Text className="pbk-h5 text-white">{team.name}</Text>
              <Pressable className="rounded-md border border-purple-800">
                <Text className="pbk-h8 p-3 text-white">Edit</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View className="mx-6 flex-1 gap-3">
          <AugmentStatusCard />
          <Button
            label="Build Your Team"
            onPress={() => {
              if (!isNavigating) {
                const route = !augment?.id
                  ? "/(protected)/(draft)/applyAugment"
                  : "/(protected)/(draft)/(teamBuilder)/roster";
                setIsNavigating(true);
                router.push(route);
              }
            }}
          />
          {isInQueue && (
            <Pressable
              className={`w-full rounded-lg p-4 ${getQueueButtonStyle()} ${
                isQueueLoading || queueStatus?.status === "matched"
                  ? "opacity-50"
                  : ""
              }`}
              disabled={isQueueLoading || queueStatus?.status === "matched"}
              onPress={handleCancelQueue}
            >
              <Text className="pbk-h6 text-center text-white">
                {getQueueButtonLabel()}
              </Text>
              {queueStatus?.status === "waiting" && (
                <Text className="mt-1 text-center text-xs text-white">
                  Searching for opponent...
                </Text>
              )}
            </Pressable>
          )}
        </View>
        <View className="mx-6 my-2 flex-1 gap-4">
          <PlayerRoster
            bench={team.bench}
            isCard
            lineup={team.lineup}
            onOpen={() => setShowBottomDrawer(true)}
            setSelectedPosition={setSelectedPosition}
          />
        </View>
      </ScrollView>
      <TeamActionButtons />
      {isNotNil(selectedPosition) && (
        <RosterDrawer
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          setShowBottomDrawer={setShowBottomDrawer}
          showBottomDrawer={showBottomDrawer}
        />
      )}
    </SafeAreaView>
  );
};

export default MyTeam;
