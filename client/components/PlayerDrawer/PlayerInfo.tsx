import { Newspaper } from "phosphor-react-native";
import { View, Text } from "react-native";
import { Player } from "@/types/player";

type PlayerInfoProps = {
  player: Player;
};

const PlayerInfo = ({ player }: PlayerInfoProps) => (
  <View className="w-full flex-1 px-4 py-4">
    <View className="flex flex-row flex-wrap justify-between">
      <View className="mb-4 w-full items-center rounded-lg border border-gray-800 bg-gray-920 p-3">
        <Text className="pbk-b3 text-center text-gray-500">SALARY</Text>
        <Text className="pbk-h7 mt-1 text-center text-base-white">
          ${player.salary.toLocaleString()}
        </Text>
      </View>
      <View className="mb-4 w-[48%] items-center rounded-lg border border-gray-800 bg-gray-920 p-4">
        <Text className="pbk-b3 text-center text-gray-500">FANTASY POINTS</Text>
        <Text className="pbk-h7 mt-1 text-center text-base-white">
          {player.averageStats.fpts ?? "--"} PPG
        </Text>
      </View>
      <View className="mb-4 w-[48%] items-center rounded-lg border border-gray-800 bg-gray-920 p-4">
        <Text className="pbk-b3 text-center text-gray-500">RANK</Text>
        {/* TODO: Add rank when available */}
        <Text className="pbk-h7 mt-1 text-center text-base-white">--</Text>
      </View>
      <View className="mb-4 w-[48%] items-center rounded-lg border border-gray-800 bg-gray-920 p-4">
        <Text className="pbk-b3 text-center text-gray-500">POSITION</Text>
        <Text className="pbk-h7 mt-1 text-center text-base-white">
          {player.positions.join(", ")}
        </Text>
      </View>
      <View className="mb-4 w-[48%] items-center rounded-lg border border-gray-800 bg-gray-920 p-4">
        <Text className="pbk-b3 text-center text-gray-500">BIRTHDATE</Text>
        {/* TODO: Add birthdate when available */}
        <Text className="pbk-h7 mt-1 text-center text-base-white">--</Text>
      </View>
      <View className="mb-4 w-full rounded-lg border border-gray-800 bg-gray-920 p-3">
        <View className="mb-2 flex-row items-center">
          <Newspaper color="white" size={20} />
          <Text className="pbk-b2 pl-2 text-left text-base-white">
            Recent News
          </Text>
        </View>
        <View className="mb-2 h-px w-full bg-gray-800" />
        {/* TODO: Add news when available */}
        <Text className="pbk-b2 text-base-white">
          There is no recent news for {player.firstName} {player.lastName}.
        </Text>
      </View>
    </View>
  </View>
);

export default PlayerInfo;
