import auth from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { clearTeam } from "@/state/slices/teamSlice";
import { clearUser } from "@/state/slices/userSlice";

const Home = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const router = useRouter();

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
    <View className="flex-1 flex-col items-center justify-center bg-base-white px-6 py-4">
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
    </View>
  );
};

export default Home;
