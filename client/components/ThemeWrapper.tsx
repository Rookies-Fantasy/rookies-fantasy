import { View, ViewStyle } from "react-native";
import { themes } from "../theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

type ThemeWrapperProps = {
  children: React.ReactNode;
};

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { mode, theme } = useAppTheme();
  const style: ViewStyle = themes[theme][mode];

  return <View style={[{ flex: 1 }, style]}>{children}</View>;
};
