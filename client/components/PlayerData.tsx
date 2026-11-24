import { View, Text } from "react-native";
import PlayerAvatar from "@/components/PlayerAvatar";
import { PlayerTeamDisplay } from "@/types/team";

type PlayerDataProps = {
  player: PlayerTeamDisplay;
};

const PlayerData = ({ player }: PlayerDataProps) => (
  <View>
    <View className="flex-row items-center gap-2">
      <PlayerAvatar firstName={player.firstName} lastName={player.lastName} />

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
