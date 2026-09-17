import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createMatchupDoc } from "../generate/matchup.js";
import type { TeamDoc } from "../types/firestore.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const homeUserId = process.env.HOME_USER_ID;
  const awayUserId = process.env.AWAY_USER_ID;
  const homeTeamId = process.env.HOME_TEAM_ID ?? "default-team";
  const awayTeamId = process.env.AWAY_TEAM_ID ?? "default-team";
  const matchupId = process.env.MATCHUP_ID ?? "default-matchup";

  if (!homeUserId || !awayUserId) {
    throw new Error(
      "Required env vars: HOME_USER_ID and AWAY_USER_ID. TEAM_ID defaults to default-team.",
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

  const matchupRef = db.collection("matchups").doc(matchupId);
  const existingMatchupSnap = await matchupRef.get();
  const matchupDoc = createMatchupDoc(
    homeUserId,
    homeTeamId,
    homeTeam,
    awayUserId,
    awayTeamId,
    awayTeam,
    {
      ...(existingMatchupSnap.exists ? existingMatchupSnap.data() : {}),
      id: matchupId,
      status: "active",
    } as any,
  );

  const batch = db.batch();
  const now = new Date();

  batch.set(matchupRef, matchupDoc);
  batch.update(db.collection("users").doc(homeUserId), {
    queueStatus: "matched",
    currentMatchupId: matchupDoc.id,
    updatedAt: now,
  });
  batch.update(db.collection("users").doc(awayUserId), {
    queueStatus: "matched",
    currentMatchupId: matchupDoc.id,
    updatedAt: now,
  });
  batch.update(
    db.collection("users").doc(homeUserId).collection("teams").doc(homeTeamId),
    {
      matchupId: matchupDoc.id,
      updatedAt: now,
    },
  );
  batch.update(
    db.collection("users").doc(awayUserId).collection("teams").doc(awayTeamId),
    {
      matchupId: matchupDoc.id,
      updatedAt: now,
    },
  );

  await batch.commit();

  console.log("Created matchup");
  console.log(`  Matchup ID: ${matchupDoc.id}`);
};
