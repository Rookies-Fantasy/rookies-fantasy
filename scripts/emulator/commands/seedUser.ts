import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createUserDoc } from "../generate/user.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const email = process.env.USER_EMAIL ?? "dev@test.com";
  const password = process.env.USER_PASSWORD ?? "password123";

  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, {
      password,
      emailVerified: true,
    });
  } catch {
    user = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });
  }

  const userDoc = createUserDoc(email, { id: user.uid, emailVerified: true });
  await db.collection("users").doc(user.uid).set(userDoc);

  console.log("Created user");
  console.log(`  UID: ${user.uid}`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
};
