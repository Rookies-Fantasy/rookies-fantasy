import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createQueueReadyScenario } from "../scenarios/queueReady.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const userEmail = process.env.USER_EMAIL ?? "queue@test.com";
  const opponentEmail = process.env.OPPONENT_EMAIL ?? "queue-opponent@test.com";
  const password = process.env.USER_PASSWORD ?? "password123";
  const result = await createQueueReadyScenario(db, auth, {
    userEmail,
    opponentEmail,
    password,
    userTeamId: process.env.USER_TEAM_ID ?? "default-team",
    opponentTeamId: process.env.OPPONENT_TEAM_ID ?? "default-team",
  });

  console.log("Created queue-ready scenario");
  console.log(`  User: ${userEmail} (${result.userId})`);
  console.log(`  Opponent: ${opponentEmail} (${result.opponentId})`);
  console.log(`  Password: ${password}`);
  console.log("Both users are idle with complete teams.");
};
