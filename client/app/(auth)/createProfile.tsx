import { useAppSelector } from "@/state/hooks";
import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function CreateProfileScreen() {
  const user = useAppSelector((state) => state.user);
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="pbk-h6 text-gray-950">This is temporary</Text>
        <Text className="pbk-b1 text-gray-950">{user.userId}</Text>
        <Text className="pbk-b1 text-gray-950">{user.email}</Text>
        <Text className="pbk-b1 text-gray-950">{user.username}</Text>

        <Link href="/" className="mt-4 py-4">
          <Text className="pbk-b2 text-purple-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
