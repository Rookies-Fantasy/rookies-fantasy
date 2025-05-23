import type { UserRecord } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp();

export const createUserInDatabase = functions.auth
  .user()
  .onCreate(async (user: UserRecord) => {
    const { uid, email } = user;
    const usersRef = admin.firestore().collection("users");

    try {
      await usersRef.doc(uid).set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        email: email || "",
        userId: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("User created in the custom users table.");
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });
