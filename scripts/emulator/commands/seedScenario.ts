import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import {
  DEFAULT_OPPONENT_EMAIL,
  DEFAULT_USER_EMAIL,
  DEFAULT_USER_PASSWORD,
} from "../core/defaults.js";
import { createMatchupScenario } from "../scenarios/matchup.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const result = await createMatchupScenario(db, auth, {
    homeEmail: process.env.HOME_USER_EMAIL ?? DEFAULT_USER_EMAIL,
    awayEmail: process.env.AWAY_USER_EMAIL ?? DEFAULT_OPPONENT_EMAIL,
    password: process.env.USER_PASSWORD ?? DEFAULT_USER_PASSWORD,
    homeTeamId: process.env.HOME_TEAM_ID,
    awayTeamId: process.env.AWAY_TEAM_ID,
    matchupId: process.env.MATCHUP_ID,
  });

  console.log("Created scenario");
  console.log(`  Home UID: ${result.homeUserId}`);
  console.log(`  Away UID: ${result.awayUserId}`);
  console.log(`  Home team ID: ${result.homeTeamId}`);
  console.log(`  Away team ID: ${result.awayTeamId}`);
  console.log(`  Matchup ID: ${result.matchupId}`);
  console.log(`  Players seeded: ${result.playersSeeded}`);
};
