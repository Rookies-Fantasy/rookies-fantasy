import { View, Text, Image } from "react-native";
import { Player } from "@/types/players";

type PlayerMatchupCardProps = {
  position: string;
  teamAPlayer?: Player | null;
  teamBPlayer?: Player | null;
};

const PlayerMatchupCard = ({
  position,
  teamAPlayer,
  teamBPlayer,
}: PlayerMatchupCardProps) => (
  <View className="mx-4 mb-4 flex-row overflow-hidden rounded-2xl border border-gray-800 bg-gray-920">
    <View className="flex-1 border-r border-gray-800 p-3">
      {teamAPlayer ? (
        <View className="flex-col">
          <View className="mb-2 flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="pbk-b3 mb-1 text-gray-400">
                {teamAPlayer.positions.join("•")}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {teamAPlayer.firstName}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {teamAPlayer.lastName}
              </Text>
            </View>
            <Image
              className="h-16 w-16 rounded-full"
              source={{ uri: teamAPlayer.headshotUrl }}
            />
          </View>

          <View className="mb-2 flex-row justify-between">
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">MIN</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.min.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">PTS</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.pts.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">REB</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.reb.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">AST</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.ast.toFixed(1)}
              </Text>
            </View>
          </View>

          <View className="mb-2 flex-row justify-between">
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">STL</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.stl.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">BLK</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.blk.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">TO</Text>
              <Text className="pbk-b2 text-base-white">
                {teamAPlayer.averageStats.tov.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">FPTS</Text>
              <Text className="pbk-b2 text-green-400">
                {teamAPlayer.averageStats.fpts.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="items-center justify-center py-4">
          <Text className="pbk-b2 text-gray-600">No Player</Text>
        </View>
      )}
    </View>

    <View className="items-center justify-center bg-gray-900 px-4">
      <Text className="pbk-h7 text-primary-500">{position}</Text>
    </View>

    <View className="flex-1 border-l border-gray-800 p-3">
      {teamBPlayer ? (
        <View className="flex-col">
          <View className="mb-2 flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="pbk-b3 mb-1 text-gray-400">
                {teamBPlayer.positions.join("•")}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {teamBPlayer.firstName}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {teamBPlayer.lastName}
              </Text>
            </View>
            <Image
              className="h-16 w-16 rounded-full"
              source={{ uri: teamBPlayer.headshotUrl }}
            />
          </View>

          <View className="mb-2 flex-row justify-between">
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">MIN</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.min.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">PTS</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.pts.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">REB</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.reb.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">AST</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.ast.toFixed(1)}
              </Text>
            </View>
          </View>

          <View className="mb-2 flex-row justify-between">
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">STL</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.stl.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">BLK</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.blk.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">TO</Text>
              <Text className="pbk-b2 text-base-white">
                {teamBPlayer.averageStats.tov.toFixed(1)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="pbk-b3 text-gray-400">FPTS</Text>
              <Text className="pbk-b2 text-green-400">
                {teamBPlayer.averageStats.fpts.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="items-center justify-center py-4">
          <Text className="pbk-b2 text-gray-600">No Player</Text>
        </View>
      )}
    </View>
  </View>
);

export default PlayerMatchupCard;
