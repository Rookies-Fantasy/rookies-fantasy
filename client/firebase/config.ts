import { getApp } from "@react-native-firebase/app";
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  buildFunctionUrl,
  normalizeEnvironment,
  resolveBackendMode,
  resolveEmulatorHost,
} from "./environment";

export const getBackendMode = () =>
  resolveBackendMode({
    flag: process.env.EXPO_PUBLIC_USE_EMULATOR,
    environment: normalizeEnvironment(Constants.expoConfig?.extra?.environment),
    isDebugBuild: __DEV__,
  });

export const getEmulatorHost = () =>
  resolveEmulatorHost(process.env.EXPO_PUBLIC_EMULATOR_HOST, Platform.OS);

// Use the same native project as Auth and Firestore, including in cloud builds.
export const getFunctionUrl = (functionName: string): string =>
  buildFunctionUrl({
    functionName,
    projectId: getApp().options.projectId,
    mode: getBackendMode(),
    emulatorHost: getEmulatorHost(),
  });
