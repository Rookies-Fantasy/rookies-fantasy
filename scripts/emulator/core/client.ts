import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const PROJECT_ID = "rookies-fantasy-development";

export const initEmulatorClient = () => {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
};
