import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { createAuthUser, createUserDoc } from "../generate/user.js";

const DEFAULT_PASSWORD = "Test1234!";

export async function run(db: Firestore, auth: Auth): Promise<void> {
  const email = process.env.USER_EMAIL ?? `user-${Date.now()}@rookies.test`;
  const password = process.env.USER_PASSWORD ?? DEFAULT_PASSWORD;

  console.log(`Creating Auth user: ${email}`);
  const uid = await createAuthUser(auth, email, password);

  // Verify the Auth user was actually created before writing to Firestore.
  await auth.getUser(uid);

  const userDoc = createUserDoc(email, { id: uid, emailVerified: false });
  await db.collection("users").doc(uid).set(userDoc);

  console.log(`Created user`);
  console.log(`  UID:      ${uid}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`\nUse UID above with seed:team (USER_ID=<uid>)`);
}
