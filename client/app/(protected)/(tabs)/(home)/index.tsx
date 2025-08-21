import { Pressable, Text, View, Image } from "react-native";
import { useAppSelector } from "@/state/hooks";
import { defaultTeamLogo, teamLogoOptions } from "@/types/asset";

const MyTeam = () => {
  const team = useAppSelector((state) => state.team);
  const matchedLogo = teamLogoOptions.find(
    (option) => option.url === team.logoUrl,
  );

  return (
    <View className="h-full w-full items-center justify-center bg-gray-950">
      <View className="h-72 w-full">
        <View className="h-1/2 bg-pink-700" />
        <View className="h-1/2 border-b border-gray-900 bg-gray-950">
          <View className="-my-[37.5px] w-full flex-row justify-between px-8">
            <Image
              className="h-[75px] w-[75px] rounded-full border-2"
              source={matchedLogo?.source ?? defaultTeamLogo.source}
            />
            <View className="h-[75px] flex-row items-center gap-8 rounded-md border-gray-900 bg-gray-920 p-4">
              <View className="flex-row items-center gap-4">
                <View className="h-8 w-8 bg-red-500"></View>
                <View>
                  <Text className="text-white">Unranked</Text>
                  <Text className="text-white">0 RP</Text>
                </View>
              </View>
              <View>
                <View className="flex-row">
                  <Text className="text-green-500">0W </Text>
                  <Text className="text-red-500">0L</Text>
                </View>
                <Text className="text-right text-white">-</Text>
              </View>
            </View>
          </View>
          <View className="my-auto w-full flex-row items-center justify-between px-8 pt-[37.5px]">
            <Text className="pbk-h5 text-white">{team.name}</Text>
            <Pressable className="rounded-md border border-purple-800">
              <Text className="pbk-h8 p-3 text-white">Edit</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View className="flex-1 flex-row items-end p-8">
        <Pressable className="flex-1 rounded-md bg-purple-600 p-4">
          <Text className="text-center uppercase text-white">
            Build Your Team
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default MyTeam;
