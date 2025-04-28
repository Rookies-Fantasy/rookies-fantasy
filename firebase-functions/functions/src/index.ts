import type { UserRecord } from "firebase-admin/auth";
const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

admin.initializeApp();

export const createUserInDatabase = functions.auth
  .user()
  .onCreate(async (user: UserRecord) => {
    const { uid, email, displayName, photoURL } = user;
    const usersRef = admin.firestore().collection("users");

    try {
      await usersRef.doc(uid).set({
        userId: uid,
        email: email || "",
        displayName: displayName || "",
        photoURL: photoURL || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("User created in the custom users table.");
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });
