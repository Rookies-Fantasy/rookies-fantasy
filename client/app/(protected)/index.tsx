import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { clearUser } from "@/state/slices/userSlice";

const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth().signOut();
      dispatch(clearUser());
      router.replace("/(auth)");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 flex-col items-center justify-center bg-base-white px-6 py-4">
      <Text className="pbk-h6 text-gray-950">Tab One</Text>
      <View className="my-30 h-16" />
      <Pressable
        className="min-h-12 w-full justify-center rounded-md bg-purple-600"
        onPress={handleLogout}
      >
        <Text className="pbk-h6 text-center text-base-white">Sign Out</Text>
      </Pressable>
      <Text>{user.username}</Text>
      <Text>{user.email}</Text>
      <Text>{user.userId}</Text>
    </View>
  );
};

export default HomeScreen;
