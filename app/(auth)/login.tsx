import { Link } from "expo-router";
import { View } from "react-native";
import { Pressable, Text } from "react-native-gesture-handler";

export default function Login() {
  return (
    <View className="flex h-full w-full items-center justify-center">
      <Link
        asChild
        href={{ pathname: "/(protected)", params: { loggedIn: "123" } }}
      >
        <Pressable>
          <Text>Log in</Text>
        </Pressable>
      </Link>
    </View>
  );
}
