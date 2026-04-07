import { faker } from "@faker-js/faker";
import type { Auth } from "firebase-admin/auth";
import type { UserDoc } from "../types/firestore.js";

export function createUserDoc(overrides?: Partial<UserDoc>): UserDoc {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: false,
    queueStatus: "idle",
    username: faker.internet.username(),
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
export async function createAuthUser(
  auth: Auth,
  email: string,
  password: string
): Promise<string> {
  const userRecord = await auth.createUser({ email, password, emailVerified: false });
  return userRecord.uid;
}
