import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import {
  DEFAULT_OPPONENT_EMAIL,
  DEFAULT_USER_EMAIL,
  DEFAULT_USER_PASSWORD,
} from "../core/defaults.js";
import { createQueueReadyScenario } from "../scenarios/queueReady.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const userEmail = process.env.USER_EMAIL ?? DEFAULT_USER_EMAIL;
  const opponentEmail = process.env.OPPONENT_EMAIL ?? DEFAULT_OPPONENT_EMAIL;
  const password = process.env.USER_PASSWORD ?? DEFAULT_USER_PASSWORD;
  const result = await createQueueReadyScenario(db, auth, {
    userEmail,
    opponentEmail,
    password,
    userTeamId: process.env.USER_TEAM_ID,
    opponentTeamId: process.env.OPPONENT_TEAM_ID,
  });

  console.log("Created queue-ready scenario");
  console.log(`  User: ${userEmail} (${result.userId})`);
  console.log(`  Opponent: ${opponentEmail} (${result.opponentId})`);
  console.log(`  User team ID: ${result.userTeamId}`);
  console.log(`  Opponent team ID: ${result.opponentTeamId}`);
  console.log(`  Password: ${password}`);
  console.log("Both users are idle with complete teams.");
};
