import React, { useEffect, useMemo } from "react";
import { config } from "./config";
import { View, ViewProps } from "react-native";
import { OverlayProvider } from "@gluestack-ui/overlay";
import { ToastProvider } from "@gluestack-ui/toast";
import { useColorScheme } from "nativewind";
import { ModeType } from "./types";

const baseStyle = { flex: 1, height: "100%", width: "100%" } as const;

export function GluestackUIProvider({
  mode = "light",
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps["style"];
}) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const style = useMemo(
    () => [config[mode], baseStyle, props.style],
    [mode, props.style],
  );

  return (
    <View style={style}>
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
