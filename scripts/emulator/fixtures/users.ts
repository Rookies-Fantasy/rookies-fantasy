import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
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

export const upsertUser = async (
  db: Firestore,
  auth: Auth,
  options: UpsertUserOptions,
): Promise<SeededUser> => {
  const { email, password, document = {} } = options;

  let authUser;
  try {
    authUser = await auth.getUserByEmail(email);
    await auth.updateUser(authUser.uid, {
      password,
      emailVerified: document.emailVerified ?? true,
    });
  } catch {
    authUser = await auth.createUser({
      email,
      password,
      emailVerified: document.emailVerified ?? true,
    });
  }

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
