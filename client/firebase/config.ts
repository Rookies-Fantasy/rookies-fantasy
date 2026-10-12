import { getApp } from "@react-native-firebase/app";
import { emulatorHost, isEmulatorEnabled } from "@/utils/emulator";

const FUNCTIONS_REGION = "us-central1";
const FUNCTIONS_EMULATOR_PORT = 5001;

// The native SDK is initialised from the environment's GoogleService-Info.plist /
// google-services.json, so its project id matches whichever build is running.
const getProjectId = (): string => {
  const { projectId } = getApp().options;

  if (projectId.length === 0) {
    throw new Error("Firebase project id is missing from the native config");
  }

  return projectId;
};

export const getFunctionBaseUrl = (functionName: string): string => {
  const projectId = getProjectId();

  return isEmulatorEnabled
    ? `http://${emulatorHost}:${FUNCTIONS_EMULATOR_PORT}/${projectId}/${FUNCTIONS_REGION}/${functionName}`
    : `https://${FUNCTIONS_REGION}-${projectId}.cloudfunctions.net/${functionName}`;
};
