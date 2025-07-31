import "react-native-reanimated";
import "@/global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store } from "../state/store";
import AuthListener from "@/components/AuthListener";
import { Theme } from "@/components/Theme";
import { useAppSelector } from "@/state/hooks";
import {
  selectIsUserSignedIn,
  selectIsUserVerified,
} from "@/state/slices/userSlice";
import { ThemeProvider, useAppTheme } from "@/theme/ThemeProvider";

global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const RootLayoutNav = () => {
  const isUserSignedIn = useAppSelector(selectIsUserSignedIn);
  const isUserVerified = useAppSelector(selectIsUserVerified);
  const { theme } = useAppTheme();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <AuthListener>
          <StatusBar style="light" />
          <Theme name={theme as "purple" | "green"}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={!isUserSignedIn || !isUserVerified}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={isUserSignedIn && isUserVerified}>
                <Stack.Screen name="(protected)" />
              </Stack.Protected>
            </Stack>
          </Theme>
        </AuthListener>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    "ClashDisplay-Bold": require("../assets/fonts/ClashDisplay-Bold.ttf"),
    "Manrope-Regular": require("../assets/fonts/Manrope-Regular.otf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // If fonts haven't loaded yet, don't render the app
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <Provider store={store}>
        <RootLayoutNav />
      </Provider>
    </ThemeProvider>
  );
};

export default RootLayout;
