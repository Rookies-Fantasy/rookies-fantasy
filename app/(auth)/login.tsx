import { View } from "react-native";
import { PressableLink } from "@/components/PressableLink";

export const Login = () => {
  return (
    <View className="flex h-full w-full items-center justify-center">
      <PressableLink
        href={{ pathname: "/(protected)", params: { loggedIn: "123" } }}
        label="Log in"
      />
    </View>
  );
};
