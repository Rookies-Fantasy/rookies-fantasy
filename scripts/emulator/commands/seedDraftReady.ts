import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD } from "../core/defaults.js";
import { createDraftReadyScenario } from "../scenarios/draftReady.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const email = process.env.USER_EMAIL ?? DEFAULT_USER_EMAIL;
  const password = process.env.USER_PASSWORD ?? DEFAULT_USER_PASSWORD;
  const result = await createDraftReadyScenario(db, auth, {
    email,
    password,
    teamId: process.env.TEAM_ID ?? "default-team",
  });

  console.log("Created draft-ready scenario");
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  UID: ${result.userId}`);
  console.log(`  Team ID: ${result.teamId}`);
  console.log(`  Players seeded: ${result.playersSeeded}`);
};
