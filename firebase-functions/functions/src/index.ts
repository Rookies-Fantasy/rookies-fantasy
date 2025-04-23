import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp();

export const createUserInDatabase = functions.auth
  .user()
  .onCreate(async (user) => {
    const { uid, email, displayName, phoneNumber, photoURL } = user;
    const usersRef = admin.firestore().collection("users");

    try {
      await usersRef.doc(uid).set({
        email: email || "",
        displayName: displayName || "",
        phoneNumber: phoneNumber || "",
        photoURL: photoURL || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("User created in the custom users table.");
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });
