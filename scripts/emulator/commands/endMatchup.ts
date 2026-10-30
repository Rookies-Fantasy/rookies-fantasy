import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { completeMatchup } from "../../../server/functions/src/matchups/completeMatchup.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const matchupId = process.env.MATCHUP_ID ?? "default-matchup";

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
