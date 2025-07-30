import { useColorScheme } from "nativewind";
import { View, ViewStyle } from "react-native";
import { themes } from "../theme/theme";

export function Theme({
  name,
  children,
}: {
  name: keyof typeof themes;
  children: React.ReactNode;
}) {
  const { colorScheme = "light" } = useColorScheme();
  const style: ViewStyle = themes[name][colorScheme];
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}
