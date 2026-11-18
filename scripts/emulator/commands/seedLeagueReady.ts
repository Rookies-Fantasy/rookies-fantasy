import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createLeagueReadyScenario } from "../scenarios/leagueReady.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const userEmail = process.env.USER_EMAIL ?? "dev@test.com";
  const opponentEmail = process.env.OPPONENT_EMAIL ?? "opponent@test.com";
  const memberEmails: [string, string] = [
    "league1@test.com",
    "league2@test.com",
  ];
  const password = process.env.USER_PASSWORD ?? "password123";
  const result = await createLeagueReadyScenario(db, auth, {
    userEmail,
    opponentEmail,
    memberEmails,
    password,
    userTeamId: process.env.USER_TEAM_ID ?? "default-team",
  });

  console.log("Created league-ready scenario");
  console.log(`  User: ${userEmail} (${result.userId})`);
  console.log(`  Opponent: ${opponentEmail} (${result.opponentId})`);
  console.log(`  Members: ${memberEmails.join(", ")}`);
  console.log(`  Password: ${password}`);
  console.log(`  Full league (4/4, user is creator): ${result.fullLeagueId}`);
  console.log(`  Open league (2/6, user can join): ${result.openLeagueId}`);
  console.log(`  League matchup (active, week 1): ${result.leagueMatchupId}`);
};
