import { View } from "react-native";
import { PressableLink } from "@/components/PressableLink";

const Login = () => (
  <View className="flex h-full w-full items-center justify-center">
    <PressableLink
      href={{ pathname: "/(protected)", params: { loggedIn: "123" } }}
      label="Log in"
    />
  </View>
);

export default Login;
