import { View } from "react-native";
import { applyCssTheme } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

type ThemeWrapperProps = {
  children: React.ReactNode;
};

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { mode, theme } = useAppTheme();
  const cssTheme = applyCssTheme(theme, mode);

  return <View style={[{ flex: 1 }, cssTheme]}>{children}</View>;
};
