import { UserPlus } from "phosphor-react-native";
import { View, Text, Pressable } from "react-native";
import PlayerData from "./PlayerData";
import { Player } from "@/types/players";

type PlayerSlotProps = {
  isCard?: boolean;
  position: string;
  playerData: Player | null;
};

const PlayerSlot = ({
  isCard = false,
  position,
  playerData,
}: PlayerSlotProps) => (
  <View
    className={`min-h-24 w-full justify-center ${isCard ? "rounded-2xl border border-gray-900" : ""} bg-gray-920`}
  >
    <View className="flex-row items-center justify-between px-3">
      <View className="flex-1 flex-row items-center gap-2">
        <Pressable className="h-8 min-w-16 items-center justify-center rounded-3xl border border-purple-400">
          <Text className="pbk-h8 text-purple-400">{position}</Text>
        </Pressable>
        {playerData ? (
          <PlayerData player={playerData} />
        ) : (
          <Text className="pbk-b2 text-base-white">Empty</Text>
        )}
      </View>

      <UserPlus color="#6042FF" size={20} />
    </View>
  </View>
);

export default PlayerSlot;
