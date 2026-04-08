import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { createTeamDoc } from "../generate/team.js";

export async function run(db: Firestore, _auth: Auth): Promise<void> {
  const userId = process.env.USER_ID;
  if (!userId) {
    throw new Error("USER_ID env var is required. Run seed:user first to get a UID.");
  }

  // Dependency check: user document must exist in Firestore.
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    throw new Error(
      `User "${userId}" not found in Firestore. Run seed:user first.`
    );
  }

  const existingTeams = await db.collection("users").doc(userId).collection("teams").limit(1).get();
  if (!existingTeams.empty) {
    console.warn(`⚠️  User "${userId}" already has a team. A new team will be created anyway.`);
  }

  const teamRef = db.collection("users").doc(userId).collection("teams").doc();
  const teamDoc = createTeamDoc({ id: teamRef.id });
  await teamRef.set(teamDoc);

  console.log(`Created team`);
  console.log(`  Team ID: ${teamDoc.id}`);
  console.log(`  Name:    ${teamDoc.name}`);
  console.log(`  User ID: ${userId}`);
  console.log(`\nUse Team ID above with seed:matchup (HOME_TEAM_ID or AWAY_TEAM_ID)`);
}
