import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createMatchupScenario } from "../scenarios/matchup.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const result = await createMatchupScenario(db, auth, {
    homeEmail: process.env.HOME_USER_EMAIL ?? "dev@test.com",
    awayEmail: process.env.AWAY_USER_EMAIL ?? "opponent@test.com",
    password: process.env.USER_PASSWORD ?? "password123",
    homeTeamId: process.env.HOME_TEAM_ID ?? "default-team",
    awayTeamId: process.env.AWAY_TEAM_ID ?? "default-team",
    matchupId: process.env.MATCHUP_ID ?? "default-matchup",
  });

  console.log("Created scenario");
  console.log(`  Home UID: ${result.homeUserId}`);
  console.log(`  Away UID: ${result.awayUserId}`);
  console.log(`  Matchup ID: ${result.matchupId}`);
  console.log(`  Players seeded: ${result.playersSeeded}`);
};
