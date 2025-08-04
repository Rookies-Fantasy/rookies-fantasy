import { useRouter } from "expo-router";
import { ArrowLeft, X } from "phosphor-react-native";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@/components/BottomSheet";
import PlayerSlot from "@/components/PlayerSlot";
import TeamBudget from "@/components/TeamBudget";
import { useAppSelector } from "@/state/hooks";
import { getLineupPlayerCount } from "@/state/slices/teamSlice";

const Roster = () => {
  const router = useRouter();
  const lineup = useAppSelector((state) => state.team.lineup);
  const selectedPlayers = useAppSelector(getLineupPlayerCount) ?? 0;
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  console.log("team from redux:", lineup);

  return (
    <SafeAreaView
      className="flex-1 bg-gray-950"
      edges={["top", "right", "left"]}
    >
      <ScrollView>
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
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

              <View className="flex-row justify-between py-4">
                <Text className="pbk-h7 text-base-white">ROSTER</Text>
                <Text className="pbk-h7 text-base-white">
                  SELECTED: {selectedPlayers}/8
                </Text>
              </View>
            </View>

            <View className="mx-6 flex-1 gap-4">
              {lineup.map((slot) => (
                <PlayerSlot
                  isCard
                  key={slot.position}
                  openDrawer={() => {
                    setSelectedPosition(slot.position);
                    setShowBottomDrawer(true);
                  }}
                  playerData={slot.player}
                  position={slot.position}
                />
              ))}
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </ScrollView>
      <BottomSheet
        footer={
          <Pressable
            className="min-h-12 w-full justify-center rounded-md bg-purple-600"
            onPress={() => {
              setShowBottomDrawer(false);
              setSelectedPosition(null);
            }}
          >
            <Text className="pbk-h6 text-center text-base-white">
              SAVE LINEUP
            </Text>
          </Pressable>
        }
        header={
          <Text className="pbk-b1 text-center text-base-white">
            Edit lineup
          </Text>
        }
        isOpen={showBottomDrawer}
        onClose={() => {
          setShowBottomDrawer(false);
          setSelectedPosition(null);
        }}
        snapPoints={["66%"]}
      >
        <View className="flex-1 border-t-2 border-gray-900">
          {lineup.map((slot) => (
            <View className="border-b-2 border-gray-900" key={slot.position}>
              <PlayerSlot
                isSelected={selectedPosition === slot.position}
                onPlayerRemove={() => {
                  if (selectedPosition === slot.position) {
                    setSelectedPosition(null);
                  }
                }}
                playerData={slot.player}
                position={slot.position}
              />
            </View>
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default Roster;
