import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse JSON
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccountJSON = await readFile(serviceAccountPath, "utf-8");
const serviceAccount = JSON.parse(serviceAccountJSON);

initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore();
