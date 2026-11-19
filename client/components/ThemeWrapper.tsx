import { useMemo } from "react";
import { View } from "react-native";
import { applyCssTheme } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

type ThemeWrapperProps = {
  children: React.ReactNode;
};

const baseStyle = { flex: 1 } as const;

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { mode, theme } = useAppTheme();

  // Keep the CSS variable object stable between renders. A new vars() object
  // makes NativeWind treat the theme variables as changed and re-render every
  // component that reads them.
  const style = useMemo(
    () => [baseStyle, applyCssTheme(theme, mode)],
    [theme, mode],
  );

  return <View style={style}>{children}</View>;
};
