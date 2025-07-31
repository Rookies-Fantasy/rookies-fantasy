import { useColorScheme } from "nativewind";
import { View, ViewStyle } from "react-native";
import { ThemeMode, themes } from "../theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

type ThemeProps = {
  name: keyof typeof themes;
  children: React.ReactNode;
};

export const Theme = ({ name, children }: ThemeProps) => {
  const { mode } = useAppTheme();
  const systemMode = useColorScheme().colorScheme ?? "light";
  const resolvedMode = mode === ThemeMode.System ? systemMode : mode;
  const style: ViewStyle = themes[name][resolvedMode];

  return <View style={[{ flex: 1 }, style]}>{children}</View>;
};
