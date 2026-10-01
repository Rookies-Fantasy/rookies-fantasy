import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { upsertTeam } from "../fixtures/teams.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const userId = process.env.USER_ID;
  if (!userId) {
    throw new Error("USER_ID env var is required. Run seed:user first.");
  }

  const teamId = process.env.TEAM_ID ?? "default-team";
  const team = await upsertTeam(db, { userId, teamId });

  console.log("Created team");
  console.log(`  Team ID: ${team.id}`);
  console.log(`  User ID: ${team.userId}`);
};
