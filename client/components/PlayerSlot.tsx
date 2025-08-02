import { UserPlus } from "phosphor-react-native";
import { View, Text } from "react-native";
import { Player } from "@/types/players";

type PlayerSlotProps = {
  position: string;
  playerData: Player | null;
};

const PlayerSlot = ({ position, playerData }: PlayerSlotProps) => (
  <View className="min-h-20 w-full justify-center rounded-2xl border border-gray-900 bg-gray-920">
    <View className="flex-row justify-between px-3">
      <View className="flex-1 flex-row items-center gap-2">
        <Text className="pbk-h8 h-8 min-w-20 rounded-3xl border border-purple-400 px-4 py-1 text-center text-purple-400">
          {position}
        </Text>
        {playerData ? (
          <Text className="pbk-b2 text-base-white">
            Full player - Tap to add player
          </Text>
        ) : (
          <Text className="pbk-b2 text-base-white">
            Empty player - Tap to add player
          </Text>
        )}
      </View>

      <View className="">
        <UserPlus color="#6042FF" size={20} />
      </View>
    </View>
  </View>
);

export default PlayerSlot;
