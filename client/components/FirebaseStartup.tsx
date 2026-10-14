import * as SplashScreen from "expo-splash-screen";
import { ReactNode, useEffect, useState } from "react";
import { Text, View } from "react-native";
import Button from "./Button";
import { initializeFirebase } from "@/firebase/initialize";

type FirebaseStartupProps = {
  children: ReactNode;
};

const FirebaseStartup = ({ children }: FirebaseStartupProps) => {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "retrying"
  >("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    initializeFirebase()
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error("Firebase startup failed:", error);
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (status === "error") SplashScreen.hide();
  }, [status]);

  // AuthListener hides the splash after loading the initial session data.
  if (status === "ready") return children;
  if (status === "loading") return null;

  return (
    <View className="flex-1 items-center justify-center bg-gray-950 px-6">
      <View className="w-full max-w-sm gap-4">
        <Text
          accessibilityRole="header"
          className="pbk-h5 text-center text-base-white"
        >
          Unable to start the app
        </Text>
        <Text className="pbk-b2 text-center text-gray-400">
          Please try again. If this keeps happening, close and reopen the app.
        </Text>
        <Button
          isLoading={status === "retrying"}
          label="Retry"
          onPress={() => {
            setStatus("retrying");
            setAttempt((previous) => previous + 1);
          }}
        />
      </View>
    </View>
  );
};

export default FirebaseStartup;
