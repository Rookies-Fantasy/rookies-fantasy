import auth from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { clearTeam } from "@/state/slices/teamSlice";
import { clearUser } from "@/state/slices/userSlice";
import { ThemeMode, ThemeName } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

const Home = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const router = useRouter();
  const { setTheme, setMode } = useAppTheme();

  const [isNavigating, setIsNavigating] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, []),
  );

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
    <View className="flex-1 flex-col items-center justify-center bg-base-white px-6 py-4 dark:bg-black">
      <Text className="pbk-h6 text-gray-950">Tab One</Text>
      <View className="my-30 h-16" />
      <Button
        className="mb-4"
        label="Build your team"
        onPress={() => {
          if (!isNavigating) {
            setIsNavigating(true);
            router.push("/(protected)/(draft)/applyAugment");
          }
        }}
      />
      <Button label="Sign Out" onPress={handleLogout} />
      <Text>{user.username}</Text>
      <Text>{user.email}</Text>
      <Text>{user.id}</Text>
      <Text>{user.emailVerified?.toString()}</Text>
      <View className="flex-row gap-4 pt-4">
        <View className="gap-4">
          <Pressable className="min-h-12 w-20 justify-center rounded-md bg-green-500">
            <Text
              className="text-center"
              onPress={() => {
                setTheme(ThemeName.Green);
              }}
            >
              Green
            </Text>
          </Pressable>
          <Pressable className="min-h-12 w-20 justify-center rounded-md bg-purple-500">
            <Text
              className="text-center"
              onPress={() => setTheme(ThemeName.Purple)}
            >
              Purple
            </Text>
          </Pressable>
        </View>
        <View className="gap-4">
          <Pressable
            className="min-h-12 w-20 justify-center rounded-md bg-black"
            onPress={() => setMode(ThemeMode.Dark)}
          >
            <Text className="text-center text-white">Dark</Text>
          </Pressable>
          <Pressable
            className="min-h-12 w-20 justify-center rounded-md bg-white"
            onPress={() => setMode(ThemeMode.Light)}
          >
            <Text className="text-center">Light</Text>
          </Pressable>
          <Pressable
            className="min-h-12 w-20 justify-center rounded-md bg-gray-500"
            onPress={() => setMode(ThemeMode.System)}
          >
            <Text className="text-center">System</Text>
          </Pressable>
        </View>
      </View>
      <View className="w-100 h-100 mt-4 justify-center rounded-md bg-primary-500 p-4">
        <Pressable className="text-center">
          <Text>Sample Button</Text>
        </Pressable>
      </View>
      <View className="w-100 h-100 mt-4 justify-center rounded-md border-2 border-black bg-white p-4 dark:bg-black">
        <Text className="text-black dark:text-white">Sample Text</Text>
      </View>
    </View>
  );
};

export default Home;
