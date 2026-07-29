import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createMatchupDoc } from "../generate/matchup.js";
import type { TeamDoc } from "../types/firestore.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const homeUserId = process.env.HOME_USER_ID;
  const homeTeamId = process.env.HOME_TEAM_ID;
  const awayUserId = process.env.AWAY_USER_ID;
  const awayTeamId = process.env.AWAY_TEAM_ID;

  if (!homeUserId || !homeTeamId || !awayUserId || !awayTeamId) {
    throw new Error(
      "Required env vars: HOME_USER_ID, HOME_TEAM_ID, AWAY_USER_ID, AWAY_TEAM_ID.",
    );
  }

  const [homeTeamSnap, awayTeamSnap] = await Promise.all([
    db.collection("users").doc(homeUserId).collection("teams").doc(homeTeamId).get(),
    db.collection("users").doc(awayUserId).collection("teams").doc(awayTeamId).get(),
  ]);

  if (!homeTeamSnap.exists || !awayTeamSnap.exists) {
    throw new Error("Both team docs must exist before creating a matchup.");
  }

  const homeTeam = homeTeamSnap.data() as TeamDoc;
  const awayTeam = awayTeamSnap.data() as TeamDoc;

  const matchupRef = db.collection("matchups").doc();
  const matchupDoc = createMatchupDoc(
    homeUserId,
    homeTeamId,
    homeTeam,
    awayUserId,
    awayTeamId,
    awayTeam,
    { id: matchupRef.id },
  );

  await matchupRef.set(matchupDoc);

  await Promise.all([
    db.collection("users").doc(homeUserId).update({
      queueStatus: "matched",
      currentMatchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(awayUserId).update({
      queueStatus: "matched",
      currentMatchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(homeUserId).collection("teams").doc(homeTeamId).update({
      matchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(awayUserId).collection("teams").doc(awayTeamId).update({
      matchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
  ]);

  console.log("Created matchup");
  console.log(`  Matchup ID: ${matchupDoc.id}`);
};
