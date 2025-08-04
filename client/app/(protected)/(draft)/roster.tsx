import { useRouter } from "expo-router";
import { ArrowLeft, X } from "phosphor-react-native";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import PlayerSlot from "@/components/PlayerSlot";
import TeamBudget from "@/components/TeamBudget";
import { useAppSelector } from "@/state/hooks";

const Roster = () => {
  const router = useRouter();
  const lineup = useAppSelector((state) => state.team.lineup);

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
                <Text className="pbk-h7 text-base-white">SELECTED: 0/8</Text>
              </View>
            </View>

            <View className="mx-6 flex-1 gap-4">
              {lineup.map((slot) => (
                <PlayerSlot
                  key={slot.position}
                  playerData={slot.player}
                  position={slot.position}
                />
              ))}
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Roster;
