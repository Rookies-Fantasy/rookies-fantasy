import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Platform } from "react-native";

// EXPO_PUBLIC_EMULATOR_HOST overrides the default host.
// Physical devices: set this to your machine's LAN IP (e.g. 192.168.1.x).
// iOS Simulator: defaults to localhost.
// Android Emulator: defaults to 10.0.2.2.
const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const EMULATOR_HOST = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? defaultHost;

export const connectToEmulators = () => {
  console.log("[Emulator] USE_EMULATOR:", process.env.EXPO_PUBLIC_USE_EMULATOR);
  console.log("[Emulator] HOST:", EMULATOR_HOST);

  if (process.env.EXPO_PUBLIC_USE_EMULATOR !== "true") return;

  auth().useEmulator(`http://${EMULATOR_HOST}:9099`);
  firestore().settings({
    host: `${EMULATOR_HOST}:8080`,
    ssl: false,
    persistence: false,
  });

  console.log(`[Emulator] Connected to Firebase emulators at ${EMULATOR_HOST}`);
};
