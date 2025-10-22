import { View, Text, Image } from "react-native";
import { Player } from "@/types/players";

type PlayerMatchupCardProps = {
  position: string;
  homePlayer?: Player | null;
  awayPlayer?: Player | null;
};

const PlayerMatchupCard = ({
  position,
  homePlayer,
  awayPlayer,
}: PlayerMatchupCardProps) => (
  <View className="mx-4 mb-4 flex-row overflow-hidden rounded-2xl border border-gray-800 bg-gray-920">
    <View className="flex-1 border-r border-gray-800 py-3">
      {homePlayer ? (
        <View className="flex-col">
          <View className="mb-2 flex-row items-start justify-between gap-2 px-3">
            <View className="flex-1">
              <Text className="pbk-b3 mb-1 text-gray-400">
                {homePlayer.positions.join("•")}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {homePlayer.firstName}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {homePlayer.lastName}
              </Text>
            </View>
            <Image
              className="h-16 w-16 rounded-full"
              source={{ uri: homePlayer.headshotUrl }}
            />
          </View>

          <View className="mb-2 flex-row justify-between border-t-2 border-gray-900 px-3 pt-3">
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">MIN</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.min.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">PTS</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.pts.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">REB</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.reb.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">AST</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.ast.toFixed(1)}
              </Text>
            </View>
          </View>

          <View className="mb-2 flex-row justify-between px-3">
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">STL</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.stl.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">BLK</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.blk.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">TO</Text>
              <Text className="pbk-b2 text-base-white">
                {homePlayer.averageStats.tov.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">FPTS</Text>
              <Text className="pbk-b2 text-green-400">
                {homePlayer.averageStats.fpts.toFixed(1)}
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

    <View className="w-16 items-center justify-center bg-gray-900">
      <Text className="pbk-h7 text-primary-500">{position}</Text>
    </View>

    <View className="flex-1 border-l border-gray-800 py-3">
      {awayPlayer ? (
        <View className="flex-col">
          <View className="mb-2 flex-row items-start justify-between gap-2 px-3">
            <View className="flex-1">
              <Text className="pbk-b3 mb-1 text-gray-400">
                {awayPlayer.positions.join("•")}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {awayPlayer.firstName}
              </Text>
              <Text className="pbk-h8 text-base-white" numberOfLines={1}>
                {awayPlayer.lastName}
              </Text>
            </View>
            <Image
              className="h-16 w-16 rounded-full"
              source={{ uri: awayPlayer.headshotUrl }}
            />
          </View>

          <View className="mb-2 flex-row justify-between border-t-2 border-gray-900 px-3 pt-3">
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">MIN</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.min.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">PTS</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.pts.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">REB</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.reb.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">AST</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.ast.toFixed(1)}
              </Text>
            </View>
          </View>

          <View className="mb-2 flex-row justify-between px-3">
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">STL</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.stl.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">BLK</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.blk.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">TO</Text>
              <Text className="pbk-b2 text-base-white">
                {awayPlayer.averageStats.tov.toFixed(1)}
              </Text>
            </View>
            <View className="items-start">
              <Text className="pbk-b3 text-gray-400">FPTS</Text>
              <Text className="pbk-b2 text-green-400">
                {awayPlayer.averageStats.fpts.toFixed(1)}
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
