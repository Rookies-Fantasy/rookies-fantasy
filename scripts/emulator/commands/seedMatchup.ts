import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { upsertActiveMatchup } from "../fixtures/matchups.js";
import { getSelectedTeamId } from "../fixtures/teams.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const homeUserId = process.env.HOME_USER_ID;
  const awayUserId = process.env.AWAY_USER_ID;
  const matchupId = process.env.MATCHUP_ID;

  if (!homeUserId || !awayUserId) {
    throw new Error(
      "Required env vars: HOME_USER_ID and AWAY_USER_ID. Each user must have a selected team or an explicit team ID override.",
    );
  }

  const [homeTeamId, awayTeamId] = await Promise.all([
    getSelectedTeamId(db, homeUserId, process.env.HOME_TEAM_ID),
    getSelectedTeamId(db, awayUserId, process.env.AWAY_TEAM_ID),
  ]);
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
