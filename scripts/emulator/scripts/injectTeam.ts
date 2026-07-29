import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createTeamDoc } from "../generate/team.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const userId = process.env.USER_ID;
  if (!userId) {
    throw new Error("USER_ID env var is required. Run seed:user first.");
  }

  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    throw new Error(`User "${userId}" not found. Run seed:user first.`);
  }

  const teamRef = db.collection("users").doc(userId).collection("teams").doc();
  const teamDoc = createTeamDoc({ id: teamRef.id });
  await teamRef.set(teamDoc);

  console.log("Created team");
  console.log(`  Team ID: ${teamRef.id}`);
  console.log(`  User ID: ${userId}`);
};
