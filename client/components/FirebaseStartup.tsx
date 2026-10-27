import * as SplashScreen from "expo-splash-screen";
import { ReactNode, useEffect, useState } from "react";
import StartupError from "./StartupError";
import { initializeFirebase } from "@/firebase/initialize";

type FirebaseStartupProps = {
  children: ReactNode;
};

const FirebaseStartup = ({ children }: FirebaseStartupProps) => {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "retrying"
  >("loading");
  const [retryCount, setRetryCount] = useState(0);

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
  }, [retryCount]);

  useEffect(() => {
    if (status === "error") SplashScreen.hide();
  }, [status]);

  // AuthListener hides the splash after loading the initial session data.
  if (status === "ready") return children;
  if (status === "loading") return null;

  return (
    <StartupError
      isLoading={status === "retrying"}
      onRetry={() => {
        setStatus("retrying");
        setRetryCount((previous) => previous + 1);
      }}
    />
  );
};

export default FirebaseStartup;
