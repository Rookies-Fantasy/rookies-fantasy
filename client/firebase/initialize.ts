import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signOut } from "@react-native-firebase/auth";
import {
  clearPersistence,
  getFirestore,
} from "@react-native-firebase/firestore";
import { Platform } from "react-native";
import { getBackendMode } from "./config";
import { connectToEmulators } from "@/utils/emulator";

// Preserve the existing key and cloud value so upgrades recognize the last backend.
const FIREBASE_ENVIRONMENT_KEY = "firebase-environment";
let initialization: Promise<void> | null = null;

const configureFirebase = async (): Promise<void> => {
  const currentEnvironment =
    getBackendMode() === "emulator" ? "emulator" : "firebase";
  const previousEnvironment = await AsyncStorage.getItem(
    FIREBASE_ENVIRONMENT_KEY,
  );

  if (previousEnvironment !== currentEnvironment) {
    await signOut(getAuth());

    // Only discard cached documents and pending writes for a known backend switch.
    // The web implementation has no persistent Firestore cache to clear.
    if (
      previousEnvironment !== null &&
      (Platform.OS === "ios" || Platform.OS === "android")
    ) {
      await clearPersistence(getFirestore());
    }
  }

  // Configure endpoints before mounting AuthListener or any database consumers.
  connectToEmulators();
  await AsyncStorage.setItem(FIREBASE_ENVIRONMENT_KEY, currentEnvironment);
};

export const initializeFirebase = (): Promise<void> => {
  if (!initialization) {
    initialization = configureFirebase().catch((error: unknown) => {
      // Failed initialization can be retried; successful initialization is reused.
      initialization = null;
      throw error;
    });
  }
  return initialization;
};
