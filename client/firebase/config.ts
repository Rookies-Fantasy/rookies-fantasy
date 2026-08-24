import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp } from "@react-native-firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signOut,
} from "@react-native-firebase/auth";
import {
  clearPersistence,
  connectFirestoreEmulator,
  getFirestore,
} from "@react-native-firebase/firestore";
import Constants from "expo-constants";
import {
  AppEnvironment,
  BackendMode,
  buildFunctionUrl,
  normalizeEnvironment,
  resolveBackendMode,
  resolveProjectId,
} from "@/firebase/environment";

const BACKEND_MODE_STORAGE_KEY = "firebaseBackendMode";
const DEFAULT_EMULATOR_HOST = "localhost";
const FUNCTIONS_REGION = "us-central1";
const FUNCTIONS_EMULATOR_PORT = 5001;
const FIRESTORE_EMULATOR_PORT = 8080;
const AUTH_EMULATOR_PORT = 9099;

type ExpoExtra = {
  environment: string;
  firebaseProjectId: string;
};

const EMPTY_EXTRA: ExpoExtra = { environment: "", firebaseProjectId: "" };

// `extra` is populated by app.config.ts. Values arrive untyped, so they are
// narrowed to strings here rather than trusted.
const getExpoExtra = (): ExpoExtra => {
  const extra = Constants.expoConfig?.extra;
  if (!extra) {
    return EMPTY_EXTRA;
  }

  return {
    environment: typeof extra.environment === "string" ? extra.environment : "",
    firebaseProjectId:
      typeof extra.firebaseProjectId === "string"
        ? extra.firebaseProjectId
        : "",
  };
};

export const getAppEnvironment = (): AppEnvironment =>
  normalizeEnvironment(getExpoExtra().environment);

// The project id the native Firebase SDK was initialised with — it comes from
// the environment-specific GoogleService-Info.plist / google-services.json, so
// it is correct for whichever build is running.
const getNativeProjectId = (): string => {
  try {
    return getApp().options.projectId ?? "";
  } catch (error) {
    console.warn("Could not read the native Firebase project id:", error);
    return "";
  }
};

export const getProjectId = (): string =>
  resolveProjectId({
    envOverride: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    expoConfig: getExpoExtra().firebaseProjectId,
    firebaseApp: getNativeProjectId(),
  });

const getEmulatorHost = (): string => {
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  return host ? host : DEFAULT_EMULATOR_HOST;
};

// Emulator wiring requires three signals to agree: the explicit opt-in flag, a
// development build environment, and a debug build. EXPO_PUBLIC_USE_EMULATOR is
// inlined at build time, so the flag on its own would let a preview or
// production build ship pointing at localhost.
export const getBackendMode = (): BackendMode =>
  resolveBackendMode({
    flag: process.env.EXPO_PUBLIC_USE_EMULATOR ?? "",
    environment: getAppEnvironment(),
    isDebugBuild: __DEV__,
  });

export const getFunctionBaseUrl = (functionName: string): string =>
  buildFunctionUrl({
    functionName,
    mode: getBackendMode(),
    projectId: getProjectId(),
    region: FUNCTIONS_REGION,
    emulatorHost: getEmulatorHost(),
    emulatorPort: FUNCTIONS_EMULATOR_PORT,
  });

const runModeGuard = async (mode: BackendMode): Promise<void> => {
  const lastMode = await AsyncStorage.getItem(BACKEND_MODE_STORAGE_KEY);
  if (lastMode === mode) {
    return;
  }

  const auth = getAuth();
  if (auth.currentUser) {
    await signOut(auth);
  }

  // Clear data cached under the previous backend. clearPersistence must run
  // before any read; if the instance has already been used it throws, which is
  // non-fatal here (reads still target the freshly wired backend).
  try {
    await clearPersistence(getFirestore());
  } catch (error) {
    console.warn("Skipping Firestore persistence clear:", error);
  }

  await AsyncStorage.setItem(BACKEND_MODE_STORAGE_KEY, mode);
};

const wireEmulators = (): void => {
  const host = getEmulatorHost();
  connectAuthEmulator(getAuth(), `http://${host}:${AUTH_EMULATOR_PORT}`);
  connectFirestoreEmulator(getFirestore(), host, FIRESTORE_EMULATOR_PORT);
};

const runInitialization = async (): Promise<void> => {
  const mode = getBackendMode();

  // Emulator wiring MUST happen before any Firestore method runs. If a Firestore
  // call (e.g. clearPersistence) executes first, connectFirestoreEmulator throws
  // and Firestore silently stays pointed at the cloud backend — reads then arrive
  // with an emulator-issued auth token the cloud rejects (permission-denied).
  if (mode === "emulator") {
    wireEmulators();
  }

  await runModeGuard(mode);
};

let initializationPromise: Promise<void> | null = null;

export const initFirebase = (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = runInitialization();
  }
  return initializationPromise;
};
