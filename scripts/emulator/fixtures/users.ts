import type { Auth, UserRecord } from "firebase-admin/auth";
import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import { createUserDoc } from "../generate/user.js";
import type { UserDoc } from "../types/firestore.js";

export type UpsertUserOptions = {
  email: string;
  password: string;
  document?: Partial<Omit<UserDoc, "email" | "id">>;
};

export type SeededUser = {
  id: string;
  email: string;
  password: string;
  document: UserDoc;
};

export type QueueUserOptions = {
  userId: string;
  teamId: string;
};

export const ensureAuthUser = async (
  auth: Auth,
  options: Pick<UpsertUserOptions, "email" | "password"> & {
    emailVerified?: boolean;
  },
): Promise<UserRecord> => {
  const { email, password, emailVerified = true } = options;
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, emailVerified });
    return existing;
  } catch {
    return auth.createUser({ email, password, emailVerified });
  }
};

export const stageUser = (
  db: Firestore,
  batch: WriteBatch,
  email: string,
  document: Partial<UserDoc> & Pick<UserDoc, "id">,
): UserDoc => {
  const userDocument = createUserDoc(email, document);
  batch.set(db.collection("users").doc(document.id), userDocument);
  return userDocument;
};

export const upsertUser = async (
  db: Firestore,
  auth: Auth,
  options: UpsertUserOptions,
): Promise<SeededUser> => {
  const { email, password, document = {} } = options;

  const authUser = await ensureAuthUser(auth, {
    email,
    password,
    emailVerified: document.emailVerified,
  });

  const userDocument = createUserDoc(email, {
    ...document,
    id: authUser.uid,
  });
  await db.collection("users").doc(authUser.uid).set(userDocument);

  return {
    id: authUser.uid,
    email,
    password,
    document: userDocument,
  };
};

export const queueUser = async (
  db: Firestore,
  options: QueueUserOptions,
): Promise<void> => {
  const userRef = db.collection("users").doc(options.userId);
  const teamRef = userRef.collection("teams").doc(options.teamId);
  const [userSnap, teamSnap] = await Promise.all([
    userRef.get(),
    teamRef.get(),
  ]);

  if (!userSnap.exists) {
    throw new Error(`User "${options.userId}" not found.`);
  }
  if (!teamSnap.exists) {
    throw new Error(
      `Team "${options.teamId}" not found for user "${options.userId}".`,
    );
  }

  await userRef.update({
    queueStatus: "queued",
    queuedAt: new Date(),
    teamId: options.teamId,
    updatedAt: new Date(),
  });
};
