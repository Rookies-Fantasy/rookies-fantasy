import { View, Text, Image } from "react-native";
import { Player } from "@/types/players";

type PlayerDataProps = {
  player: Player;
};

const PlayerData = ({ player }: PlayerDataProps) => (
  <View>
    <View className="flex-row items-center gap-2">
      <Image
        className="size-14 rounded-full"
        source={{ uri: player.headshotUrl }}
      />

      <View className="flex-1">
        <View className="w-full overflow-hidden">
          <Text
            className="pbk-b2 text-base-white"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {player.firstName.slice(0, 1)}. {player.lastName}
          </Text>
        </View>
        <Text className="pbk-b2 text-green-200">
          ${player.salary.toLocaleString()}
        </Text>
        <View className="flex-row gap-2">
          <Text className="pbk-b2 text-base-white">
            {player.teamAbbreviation}
          </Text>
          <Text className="pbk-b2 text-base-white">
            {player.positions.join(", ")}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

export default PlayerData;
