import { useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
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
import AugmentCard from "@/components/AugmentCard";
import IconButton from "@/components/IconButton";
import PlayerRoster from "@/components/PlayerRoster";
import RosterDrawer from "@/components/RosterDrawer";
import TeamActionButtons from "@/components/TeamActionButtons";
import TeamBudget from "@/components/TeamBudget";
import { useAppSelector } from "@/state/hooks";
import { SlotPosition } from "@/types/team";
import { isNotNil } from "@/utils/jsUtils";

const Roster = () => {
  const router = useRouter();
  const team = useAppSelector((state) => state.team);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<SlotPosition | null>(
    null,
  );

  return (
    <SafeAreaView
      className="relative flex-1 bg-gray-950"
      edges={["top", "right", "left"]}
    >
      <Pressable className="relative flex-1" onPress={Keyboard.dismiss}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <KeyboardAvoidingView className="flex-1">
            <View className="px-6">
              <View className="mb-10 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <IconButton
                    className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                    icon={<ArrowLeft color="white" size={20} weight="bold" />}
                    onPress={async () => {
                      router.dismissTo("/(protected)/(tabs)/(home)");
                    }}
                  />
                  <Text className="pbk-h5 text-base-white">Team builder</Text>
                </View>
              </View>

              <View className="gap-4">
                <AugmentCard />

                <TeamBudget />
              </View>
            </View>

            <View className="mx-6 mb-24 mt-4 flex-1 gap-4">
              <PlayerRoster
                bench={team.bench}
                isCard
                lineup={team.lineup}
                onOpen={() => setShowBottomDrawer(true)}
                setSelectedPosition={setSelectedPosition}
              />
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
        <TeamActionButtons />
      </Pressable>
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

export default Roster;
