import { View, Text } from "react-native";
import { PressableLink } from "@/components/PressableLink";

export default function Login() {
  return (
    <View className="flex h-full w-full items-center justify-center">
      <PressableLink
        href={{ pathname: "/(protected)", params: { loggedIn: "123" } }}
        label={<Text>Log in</Text>}
      />
    </View>
  );
}
