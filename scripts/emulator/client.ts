// IMPORTANT: emulator env vars must be set before initializeApp().
// This module must be imported before any firebase-admin usage.

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

export const PROJECT_ID = "rookies-fantasy-development";

export type EmulatorClient = {
  db: Firestore;
  auth: Auth;
};

export const initEmulatorClient = (): EmulatorClient => {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }

  return {
    db: getFirestore(),
    auth: getAuth(),
  };
}
