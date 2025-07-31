import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { clearTeam } from "@/state/slices/teamSlice";
import { clearUser } from "@/state/slices/userSlice";
import { ThemeName } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

const Home = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const router = useRouter();
  const { setTheme } = useAppTheme();

  const handleLogout = async () => {
    try {
      await auth().signOut();
      dispatch(clearUser());
      dispatch(clearTeam());
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
      <Text>{user.id}</Text>
      <Text>{user.emailVerified?.toString()}</Text>
      <View>
        <Pressable className="min-h-12 w-20 justify-center rounded-md bg-yellow-600">
          <Text className="text-center">Yellow</Text>
        </Pressable>
        <Pressable className="min-h-12 w-20 justify-center rounded-md bg-green-600">
          <Text
            className="text-center"
            onPress={() => {
              setTheme(ThemeName.Green);
            }}
          >
            Green
          </Text>
        </Pressable>
        <Pressable className="min-h-12 w-20 justify-center rounded-md bg-purple-600">
          <Text
            className="text-center"
            onPress={() => setTheme(ThemeName.Purple)}
          >
            Purple
          </Text>
        </Pressable>
      </View>
      <View>
        <Pressable className="min-h-12 w-20 justify-center rounded-md bg-black">
          <Text className="text-center text-white">Dark</Text>
        </Pressable>
        <Pressable className="min-h-12 w-20 justify-center rounded-md bg-white">
          <Text className="text-center">Light</Text>
        </Pressable>
        <Pressable className="min-h-12 w-20 justify-center rounded-md bg-purple-600">
          <Text className="text-center">System</Text>
        </Pressable>
        <Pressable className="bg-background min-h-12 w-20 justify-center rounded-md">
          <Text className="text-center">Button</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Home;
