import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { completeMatchup } from "../../../server/functions/src/matchups/completeMatchup.js";
import { DEFAULT_USER_EMAIL } from "../core/defaults.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  let matchupId = process.env.MATCHUP_ID;
  if (!matchupId) {
    const email =
      process.env.USER_EMAIL ??
      process.env.HOME_USER_EMAIL ??
      DEFAULT_USER_EMAIL;
    const userId =
      process.env.USER_ID ?? (await auth.getUserByEmail(email)).uid;
    const user = await db.collection("users").doc(userId).get();
    const currentMatchupId = user.data()?.currentMatchupId;
    if (typeof currentMatchupId !== "string" || !currentMatchupId) {
      console.log(
        `User "${userId}" has no current matchup. Nothing to complete.`,
      );
      return;
    }
    matchupId = currentMatchupId;
  }

  const matchupRef = db.collection("matchups").doc(matchupId);
  const matchupSnap = await matchupRef.get();

  if (!matchupSnap.exists) {
    throw new Error(`Matchup "${matchupId}" not found.`);
  }

  const completed = await completeMatchup(db, matchupSnap);
  if (!completed) {
    console.warn(`Matchup "${matchupId}" is already completed. Skipping.`);
    return;
  }

  console.log(`Completed matchup "${matchupId}"`);
};
