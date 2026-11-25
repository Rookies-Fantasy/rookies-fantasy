import type { UserRecord } from "firebase-admin/auth";
import * as functions from "firebase-functions/v1";
import { admin } from "../shared/admin";
import { cleanUpDeletedUser } from "./cleanUpDeletedUser";

// Cleans up a user's data after their auth account is deleted (in-app
// account deletion, required by App Store guideline 5.1.1(v)).
export const deleteUserData = functions.auth
  .user()
  .onDelete(async (user: UserRecord) => {
    const { uid } = user;

    try {
      const result = await cleanUpDeletedUser(admin.firestore(), uid);
      console.log(
        `Cleaned up deleted user ${uid}: anonymized=${result.anonymized}, ` +
          `leaguesRemovedFrom=${result.leaguesRemovedFrom}, ` +
          `leaguesDeleted=${result.leaguesDeleted}`,
      );
    } catch (error) {
      console.error(`Error cleaning up deleted user ${uid}:`, error);
      throw error;
    }
  });
