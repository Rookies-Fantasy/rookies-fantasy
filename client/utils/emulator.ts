import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Platform } from "react-native";

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const emulatorHost = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? defaultHost;

export const connectToEmulators = () => {
  if (process.env.EXPO_PUBLIC_USE_EMULATOR !== "true") {
    return;
  }

  auth().useEmulator(`http://${emulatorHost}:9099`);
  firestore().settings({
    host: `${emulatorHost}:8080`,
    ssl: false,
    persistence: false,
  });

  console.log(`[Emulator] Connected to Firebase emulators at ${emulatorHost}`);
};
