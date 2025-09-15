import type { UserRecord } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { onDocumentWritten } from "firebase-functions/firestore";
import { validatePrerequisite } from "./augmentsValidation/validation";
import { Player, Prerequisite } from "../types/augments";

admin.initializeApp();

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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });

export const validateTeamAugment = onDocumentWritten(
  "teams/{teamId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    const lineupChanged =
      JSON.stringify(beforeData?.lineup) !== JSON.stringify(afterData?.lineup);
    const augmentChanged = beforeData?.augmentId !== afterData?.augmentId;

    if (!lineupChanged && !augmentChanged) {
      return;
    }

    const augmentDoc = await admin
      .firestore()
      .collection("augments")
      .doc(afterData?.augmentId)
      .get();

    if (!augmentDoc.exists) return;

    const augment = augmentDoc.data();
    const result = validateAugmentPrerequisites(
      augment?.prerequisites,
      afterData?.lineup,
    );
  },
);

function validateAugmentPrerequisites(
  prerequisites: Prerequisite[],
  lineup: Player[],
) {
  const players = lineup; // Array of player objects
  const qualifyingPlayers = new Set();
  const unmetRequirements = [];

  for (const prerequisite of prerequisites) {
    const result = validatePrerequisite(prerequisite, players);

    if (!result) {
      unmetRequirements.push(prerequisite.description);
    }
  }

  return unmetRequirements.length === 0;
}
