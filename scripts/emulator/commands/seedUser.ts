import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD } from "../core/defaults.js";
import { upsertUser } from "../fixtures/users.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const email = process.env.USER_EMAIL ?? DEFAULT_USER_EMAIL;
  const password = process.env.USER_PASSWORD ?? DEFAULT_USER_PASSWORD;

  const user = await upsertUser(db, auth, { email, password });

  console.log("Created user");
  console.log(`  UID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Password: ${user.password}`);
};
