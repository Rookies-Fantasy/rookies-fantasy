import { Text, View, Image } from "react-native";
import { useAppSelector } from "@/state/hooks";
import { selectTeam } from "@/state/slices/teamSlice";
import { teamLogoOptions } from "@/types/asset";

const Arena = () => {
  const team = useAppSelector(selectTeam);

  // Find the matching asset by URL to get the proper source
  const teamLogo = teamLogoOptions.find(
    (asset) => asset.url === team.logoUrl,
  )?.source;

  return (
    <View className="flex-1 flex-col items-center bg-gray-950">
      <View className="w-full flex-row">
        <View className="w-1/2 border-b border-r border-gray-900 py-4 pl-6 pr-2">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Image
              className="h-12 w-12 rounded-full border-2"
              source={teamLogo}
            />

            <Text className="pbk-h5 text-base-white">440</Text>
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            CALGARY GHOSTS
          </Text>

          <Text className="pbk-b3 text-base-white">0W 0L (-% WR)</Text>
        </View>

        <View className="w-1/2 items-end border-b border-l border-gray-900 py-4 pl-2 pr-6">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Text className="pbk-h5 text-base-white">478</Text>

            <Image
              className="h-12 w-12 rounded-full border-2"
              source={teamLogo}
            />
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            GUNS N ROSES
          </Text>

          <Text className="pbk-b3 text-base-white">1W 0L (100% WR)</Text>
        </View>
      </View>
    </View>
  );
};

export default Arena;
