import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@/state/hooks";

const MyTeam = () => {
  const user = useAppSelector((state) => state.user);

  return (
    <SafeAreaView className="h-full w-full items-center justify-center bg-gray-950">
      <View className="h-[200px] w-full">
        <View className="h-1/2 bg-pink-700" />
        <View className="h-1/2 border-b border-gray-900 bg-gray-950">
          <View className="top-0 w-full -translate-y-1/2 flex-row justify-between px-8">
            <View className="h-[70px] w-[50px] rounded-full bg-orange-700"></View>
            <View className="h-[50px] w-[200px] rounded-md border-gray-900 bg-gray-920"></View>
          </View>
          <View className="w-full flex-row items-center justify-between px-8">
            <Text className="pbk-h5 text-white">Team Name</Text>
            <Pressable className="rounded-md border border-purple-800">
              <Text className="pbk-h8 p-3 text-white">Edit</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View className="flex flex-1 justify-center">
        <Text className="text-white">My Team</Text>
      </View>
    </SafeAreaView>
  );
};

export default MyTeam;
