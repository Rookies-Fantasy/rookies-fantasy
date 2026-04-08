import type { Auth } from "firebase-admin/auth";
import type { UserDoc } from "../types/firestore.js";

export const createUserDoc = (email: string, overrides?: Partial<UserDoc>): UserDoc => {
  const now = new Date();
  const username = email.split("@")[0];
  return {
    id: crypto.randomUUID(),
    email,
    emailVerified: false,
    queueStatus: "idle",
    username,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates an Auth user in the emulator and returns the generated UID.
 * Pass the returned UID as `overrides.id` to createUserDoc() so that
 * the Auth UID matches the Firestore document ID.
 */
export const createAuthUser = async (
  auth: Auth,
  email: string,
  password: string
): Promise<string> => {
  const userRecord = await auth.createUser({ email, password, emailVerified: true });
  return userRecord.uid;
}
