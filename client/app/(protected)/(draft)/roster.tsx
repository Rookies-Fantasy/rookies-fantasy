import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { clearUser } from "@/state/slices/userSlice";

const Players = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <View className="flex-1 flex-col items-center justify-center bg-base-white px-6 py-4">
      <Text className="pbk-h6 text-gray-950">Roster</Text>
      <View className="my-30 h-16" />
    </View>
  );
};

export default Players;
