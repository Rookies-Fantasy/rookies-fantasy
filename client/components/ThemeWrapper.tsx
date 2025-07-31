import { useColorScheme } from "nativewind";
import { View, ViewStyle } from "react-native";
import { ThemeMode, themes } from "../theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

type ThemeWrapperProps = {
  children: React.ReactNode;
};

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { mode, theme } = useAppTheme();
  const systemMode = useColorScheme().colorScheme ?? "light";
  const resolvedMode = mode === ThemeMode.System ? systemMode : mode;
  const style: ViewStyle = themes[theme][resolvedMode];

  return <View style={[{ flex: 1 }, style]}>{children}</View>;
};
