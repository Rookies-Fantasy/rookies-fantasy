import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { SignOut } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, View, Image, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import AugmentStatusCard from "@/components/AugmentStatusCard";
import Button from "@/components/Button";
import PlayerRoster from "@/components/PlayerRoster";
import RosterDrawer from "@/components/RosterDrawer";
import TeamActionButtons from "@/components/TeamActionButtons";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectAugment,
  selectRosterPlayerCount,
  clearTeam,
} from "@/state/slices/teamSlice";
import { selectUserId, clearUser } from "@/state/slices/userSlice";
import { defaultTeamLogo, teamLogoOptions } from "@/types/asset";
import { SlotPosition } from "@/types/team";
import { cn, isNotNil } from "@/utils/jsUtils";
import { isTeamReadyForQueue } from "@/utils/teamUtils";

const MyTeam = () => {
  const router = useRouter();
  const team = useAppSelector((state) => state.team);
  const user = useAppSelector((state) => state.user);
  const userId = useAppSelector(selectUserId);
  const augment = useAppSelector(selectAugment);
  const playerCount = useAppSelector(selectRosterPlayerCount);
  const dispatch = useAppDispatch();

  const queueStatus = user.queueStatus ?? "idle";
  const isInQueue = queueStatus === "queued";
  const isMatched = queueStatus === "matched";
  const matchedLogo = teamLogoOptions.find(
    (option) => option.url === team.logoUrl,
  );
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<SlotPosition | null>(
    null,
  );
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      dispatch(clearUser());
      dispatch(clearTeam());
      router.replace("/(auth)");
    } catch (error) {
      console.log(error);
    }
  };

  const handleQueueToggle = async () => {
    if (isInQueue) {
      try {
        await UserController.leaveQueue(userId);
        console.log("Successfully left queue");
      } catch (error) {
        Alert.alert("Error", "Failed to leave queue. Please try again.");
        console.error("Queue leave error:", error);
      }
    } else {
      if (isTeamReadyForQueue(team.lineup) && team.id) {
        console.log("Attempting to join queue with team ID:", team.id);
        try {
          await UserController.joinQueue(userId, team.id);
          console.log("Successfully joined queue");
        } catch (error) {
          Alert.alert("Error", "Failed to join queue. Please try again.");
          console.error("Queue join error:", error);
        }
      } else {
        Alert.alert(
          "Team Not Ready",
          "Your team must have all positions filled to enter the queue.",
        );
      }
    }
  };

  return (
    <View className="flex-1 bg-base-white dark:bg-black">
      <ScrollView
        contentContainerClassName={cn(
          "flex-col",
          team.hasUserChanges && "pb-20",
        )}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full flex-row items-center justify-between border-b-2 border-gray-900 px-8 pb-6 pt-10">
          <View className="flex-row items-center gap-5">
            <Image
              className="h-[75px] w-[75px] rounded-full border-2"
              source={matchedLogo?.source ?? defaultTeamLogo.source}
            />
            <Text className="pbk-h5 text-black dark:text-white">
              {team.name}
            </Text>
          </View>
          <Pressable
            className="flex-row items-center gap-2 rounded-lg bg-primary-500 p-2"
            onPress={handleLogout}
          >
            <Text className="pbk-h8 text-white">Sign Out</Text>
            <SignOut color="white" size={20} weight="bold" />
          </Pressable>
        </View>
        <View className="flex-1 gap-6 px-8 pt-6">
          {playerCount > 0 ? (
            <>
              {!isMatched && (
                <Button
                  className={isInQueue ? "bg-red-600" : "bg-primary-500"}
                  label={isInQueue ? "Cancel Queue" : "Queue"}
                  onPress={handleQueueToggle}
                />
              )}
              <AugmentStatusCard />
              <View className="my-2 flex-1 gap-4">
                <PlayerRoster
                  bench={team.bench}
                  isCard
                  lineup={team.lineup}
                  onOpen={() => setShowBottomDrawer(true)}
                  setSelectedPosition={setSelectedPosition}
                />
              </View>
            </>
          ) : (
            <View className="flex-1 flex-col bg-red-500 pb-10">
              <View className="w-full flex-row gap-3 rounded-lg bg-gray-900 p-4">
                <Text className="pbk-bl">💸</Text>
                <View className="flex-1">
                  <Text className="pbk-b1 text-base-white">
                    Build your team. Stay under $150M 💰
                  </Text>
                  <Text className="pbk-b2 text-gray-400">
                    Choose 8 players for your weekly lineup. You&#39;ve got 4
                    swaps to cover injuries or make strategic moves.
                  </Text>
                </View>
              </View>
              <Button
                className="justify-end"
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
            </View>
          )}
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
    </View>
  );
};

export default MyTeam;
