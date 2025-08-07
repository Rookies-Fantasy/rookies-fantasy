import { useRouter } from "expo-router";
import { ArrowLeft, X } from "phosphor-react-native";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import FloatingActionButton from "@/components/FloatingActionButton";
import PlayerRoster from "@/components/PlayerRoster";
import RosterDrawer from "@/components/RosterDrawer";
import TeamBudget from "@/components/TeamBudget";
import { UserController } from "@/controllers/userController";
import { useAppSelector } from "@/state/hooks";
import { getLineupPlayerCount } from "@/state/slices/teamSlice";
import { SlotPosition } from "@/types/teamTypes";

const Roster = () => {
  const router = useRouter();
  const team = useAppSelector((state) => state.team);
  const userId = useAppSelector((state) => state.user.id);
  const selectedPlayers = useAppSelector(getLineupPlayerCount) ?? 0;
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<SlotPosition | null>(
    null,
  );

  const handleSaveLineup = async () => {
    try {
      if (team.balance < 0) {
        Alert.alert(
          "Insufficient balance",
          "Please adjust your selections to stay within your available funds.",
        );
        return;
      }

      await UserController.saveUserTeamLineup(
        userId,
        team.id,
        team.lineup,
        team.balance,
      );

      router.replace("/(protected)/(tabs)");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView
      className="relative flex-1 bg-gray-950"
      edges={["top", "right", "left"]}
    >
      <Pressable className="relative flex-1" onPress={Keyboard.dismiss}>
        <ScrollView>
          <KeyboardAvoidingView className="flex-1">
            <View className="px-6">
              <View className="mb-10 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Pressable
                    className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                    onPress={() => router.back()}
                  >
                    <ArrowLeft color="white" size={20} weight="bold" />
                  </Pressable>
                  <Text className="pbk-h5 text-base-white">Team builder</Text>
                </View>
                <Pressable
                  className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                  onPress={() => router.dismissAll()}
                >
                  <X color="white" size={20} weight="bold" />
                </Pressable>
              </View>

              <TeamBudget />

              <View className="mt-6 flex-row justify-between">
                <Text className="pbk-h7 text-base-white">ROSTER</Text>
                <Text className="pbk-h7 text-base-white">
                  SELECTED: {selectedPlayers}/8
                </Text>
              </View>
            </View>

            <View className="mx-6 my-2 flex-1 gap-4">
              <PlayerRoster
                lineup={team.lineup}
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
                setShowBottomDrawer={setShowBottomDrawer}
                showBottomDrawer={showBottomDrawer}
              />
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
        <FloatingActionButton
          className="bottom-6 w-[90%] self-center"
          onPress={() => handleSaveLineup()}
        >
          <Text className="pbk-h6 text-center text-base-white">
            LOCK IN TEAM
          </Text>
        </FloatingActionButton>
      </Pressable>
      <RosterDrawer
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        setShowBottomDrawer={setShowBottomDrawer}
        showBottomDrawer={showBottomDrawer}
      />
    </SafeAreaView>
  );
};

export default Roster;
