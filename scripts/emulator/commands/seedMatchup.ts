import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { upsertActiveMatchup } from "../fixtures/matchups.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const homeUserId = process.env.HOME_USER_ID;
  const awayUserId = process.env.AWAY_USER_ID;
  const homeTeamId = process.env.HOME_TEAM_ID ?? "default-team";
  const awayTeamId = process.env.AWAY_TEAM_ID ?? "default-team";
  const matchupId = process.env.MATCHUP_ID ?? "default-matchup";

  if (!homeUserId || !awayUserId) {
    throw new Error(
      "Required env vars: HOME_USER_ID and AWAY_USER_ID. TEAM_ID defaults to default-team.",
    );
  }

  const matchup = await upsertActiveMatchup(db, {
    matchupId,
    homeUserId,
    homeTeamId,
    awayUserId,
    awayTeamId,
  });

  console.log("Created matchup");
  console.log(`  Matchup ID: ${matchup.id}`);
};
