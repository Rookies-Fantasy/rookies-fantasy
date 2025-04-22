import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="pbk-h1 text-gray-950">This screen doesn't exist.</Text>

        <Link href="/" className="mt-4 py-4">
          <Text className="pbk-b2 text-purple-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
