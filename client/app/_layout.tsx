import "react-native-reanimated";
import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import {
  Stack,
  DefaultTheme,
  DarkTheme,
  ThemeProvider as ReactNavigationThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import AuthListener from "@/components/AuthListener";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { initFirebase } from "@/firebase/config";
import { useAppSelector } from "@/state/hooks";
import {
  selectIsUserSignedIn,
  selectIsUserVerified,
} from "@/state/slices/userSlice";
import { store } from "@/state/store";
import { themes, ThemeMode } from "@/theme/theme";
import { ThemeProvider, useAppTheme } from "@/theme/ThemeProvider";

global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
const queryClient = new QueryClient();

const RootLayoutNav = () => {
  const isUserSignedIn = useAppSelector(selectIsUserSignedIn);
  const isUserVerified = useAppSelector(selectIsUserVerified);
  const { theme, mode } = useAppTheme();

  const navTheme = {
    ...(mode === ThemeMode.Light ? DefaultTheme : DarkTheme),
    colors: {
      ...(mode === ThemeMode.Light ? DefaultTheme.colors : DarkTheme.colors),
      primary: `rgb(${themes[theme][mode][500]})`,
      background: `rgb(${themes[theme][mode].mode})`,
      text: `rgb(${themes[theme][mode].modeContrast})`,
    },
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <QueryClientProvider client={queryClient}>
          <AuthListener>
            <StatusBar style={mode === ThemeMode.Dark ? "light" : "dark"} />
            <ThemeWrapper>
              <ReactNavigationThemeProvider value={navTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Protected guard={!isUserSignedIn || !isUserVerified}>
                    <Stack.Screen name="(auth)" />
                  </Stack.Protected>
                  <Stack.Protected guard={isUserSignedIn && isUserVerified}>
                    <Stack.Screen name="(protected)" />
                  </Stack.Protected>
                </Stack>
              </ReactNavigationThemeProvider>
            </ThemeWrapper>
          </AuthListener>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    "ClashDisplay-Bold": require("../assets/fonts/ClashDisplay-Bold.ttf"),
    "Manrope-Regular": require("../assets/fonts/Manrope-Regular.otf"),
  });
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    initFirebase()
      .catch((error) => {
        console.error("Firebase initialization failed:", error);
      })
      .finally(() => {
        if (mounted) {
          setFirebaseReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const appReady = fontsLoaded && firebaseReady;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
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
