import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "node:fs/promises";

// Read and parse JSON
// Keep the existing credential location at scripts/serviceAccountKey.json.
const serviceAccountPath = new URL("../serviceAccountKey.json", import.meta.url);
const serviceAccountJSON = await readFile(serviceAccountPath, "utf-8");
const serviceAccount = JSON.parse(serviceAccountJSON);

initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore();
