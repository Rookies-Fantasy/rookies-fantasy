import "react-native-reanimated";
import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const RootLayoutNav = () => {
  const queryClient = new QueryClient();

  return (
    <SafeAreaProvider>
      <GluestackUIProvider>
        <GestureHandlerRootView>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <AuthListener>
                <StatusBar style="light" />
                <Stack screenOptions={{ animation: "none" }}>
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(protected)"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </AuthListener>
            </Provider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </GluestackUIProvider>
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

  return <RootLayoutNav />;
};

export default RootLayout;
