import { useMemo } from "react";
import { View } from "react-native";
import { applyCssTheme } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

type ThemeWrapperProps = {
  children: React.ReactNode;
};

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { mode, theme } = useAppTheme();

  // Keep the CSS variable object stable between renders. A new vars() object
  // makes NativeWind treat the theme variables as changed and re-render every
  // component that reads them.
  const cssTheme = useMemo(() => applyCssTheme(theme, mode), [theme, mode]);

  return (
    <View className="flex-1" style={cssTheme}>
      {children}
    </View>
  );
};
