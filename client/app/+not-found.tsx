import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

const NotFoundScreen = () => (
  <>
    <Stack.Screen options={{ title: "Oops!" }} />
    <View className="flex-1 items-center justify-center p-5">
      <Text className="pbk-h1 text-gray-950">This screen does not exist.</Text>

      <Link className="mt-4 py-4" href="/">
        <Text className="pbk-b2 text-purple-500">Go to home screen!</Text>
      </Link>
    </View>
  </>
);

export default NotFoundScreen;
