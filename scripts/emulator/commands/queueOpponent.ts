import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { queueUser } from "../fixtures/users.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const email = process.env.OPPONENT_EMAIL ?? "queue-opponent@test.com";
  const teamId = process.env.OPPONENT_TEAM_ID ?? "default-team";
  const user = await auth.getUserByEmail(email);

  await queueUser(db, { userId: user.uid, teamId });

  console.log(`Queued opponent "${email}".`);
  console.log("The local processQueue function should now create the matchup.");
};
