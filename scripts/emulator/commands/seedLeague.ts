import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createLeague } from "../fixtures/leagues.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const userId = process.env.USER_ID;
  if (!userId) {
    throw new Error("USER_ID env var is required. Run seed:user first.");
  }

  const leagueId = process.env.LEAGUE_ID ?? "default-league";
  const teamId =
    process.env.LEAGUE_TEAM_ID ??
    db.collection("users").doc(userId).collection("teams").doc().id;
  const name = process.env.LEAGUE_NAME ?? "Dev League";
  const numberOfTeams = Number(process.env.NUMBER_OF_TEAMS ?? "4");
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < 1) {
    throw new Error("NUMBER_OF_TEAMS must be a positive integer.");
  }

  const result = await createLeague(db, {
    leagueId,
    userId,
    teamId,
    document: { name, numberOfTeams },
  });

  if (!result.created) {
    console.log(
      `League "${result.leagueId}" already exists. Joining an existing league is not supported yet; nothing was changed.`,
    );
    return;
  }

  console.log("Created league");
  console.log(`  League ID: ${result.leagueId}`);
  console.log(`  Name: ${result.document.name}`);
  console.log(`  Teams: 1/${result.document.numberOfTeams}`);
  console.log(`  Creator: ${userId}`);
  console.log(`  League team ID: ${teamId}`);
};
