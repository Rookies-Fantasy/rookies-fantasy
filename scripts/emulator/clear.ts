import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { PROJECT_ID } from "./client.js";

export const clearFirestore = async (): Promise<void> => {
  const url = `http://localhost:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Failed to clear Firestore emulator: ${res.status} ${res.statusText}`);
  }
};

export const clearAuth = async (auth: Auth): Promise<void> => {
  const { users } = await auth.listUsers();
  if (users.length === 0) return;
  await Promise.all(users.map((user) => auth.deleteUser(user.uid)));
};

export const clearAll = async (_db: Firestore, auth: Auth): Promise<void> => {
  await Promise.all([clearFirestore(), clearAuth(auth)]);
  console.log("Emulator data cleared.");
};
