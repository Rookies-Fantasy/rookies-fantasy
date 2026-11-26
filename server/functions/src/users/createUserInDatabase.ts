import type { UserRecord } from "firebase-admin/auth";
import * as functions from "firebase-functions/v1";
import { admin, FieldValue } from "../shared/admin";

const ALREADY_EXISTS_CODE = 6; // gRPC status code for ALREADY_EXISTS

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
      await usersRef.doc(uid).create({
        id: uid,
        email: email,
        emailVerified: emailVerified,
        queueStatus: "idle",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === ALREADY_EXISTS_CODE
      ) {
        console.log(`User doc for ${uid} already exists, skipping create`);
        return;
      }
      console.error("Error creating user in Firestore:", error);
    }
  });
