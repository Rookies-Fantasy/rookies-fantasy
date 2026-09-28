import type { UserRecord } from "firebase-admin/auth";
import * as functions from "firebase-functions/v1";
import { admin } from "./shared/admin";

export { getEarliestGameStartTime } from "./matchups/getEarliestGameStartTime";
export { weeklyMatchupReset } from "./matchups/weeklyMatchupReset";
export { getLiveData } from "./players/getLiveData";
export { updateDailyPlayerData } from "./players/updateDailyPlayerData";
export { processQueue } from "./ranked/processQueue";

export const createUserInDatabase = functions.auth
  .user()
  .onCreate(async (user: UserRecord) => {
    const { uid, email, emailVerified } = user;
    const usersRef = admin.firestore().collection("users");

    if (!email?.trim()) {
      console.error(`${uid} has invalid or missing email`);
      throw new Error("Email is required for user creation.");
    }

    try {
      await usersRef.doc(uid).set({
        id: uid,
        email: email,
        emailVerified: emailVerified,
        queueStatus: "idle",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });
