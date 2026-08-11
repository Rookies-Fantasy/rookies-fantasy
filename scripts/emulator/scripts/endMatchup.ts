import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const matchupId = process.env.MATCHUP_ID ?? "default-matchup";

  const matchupRef = db.collection("matchups").doc(matchupId);
  const matchupSnap = await matchupRef.get();

  if (!matchupSnap.exists) {
    throw new Error(`Matchup "${matchupId}" not found.`);
  }

  const matchup = matchupSnap.data();
  if (matchup?.status === "completed") {
    console.warn(`Matchup "${matchupId}" is already completed. Skipping.`);
    return;
  }

  await matchupRef.set(
    {
      status: "completed",
    },
    { merge: true },
  );

  const { homeUserId, awayUserId, homeTeamId, awayTeamId, homeScore, awayScore } =
    matchup ?? {};

  const winnerId =
    homeScore === awayScore
      ? undefined
      : homeScore > awayScore
        ? homeUserId
        : awayUserId;

  const batch = db.batch();
  batch.set(
    matchupRef,
    {
      status: "completed",
      winnerId,
    },
    { merge: true },
  );

  if (homeUserId) {
    batch.update(db.collection("users").doc(homeUserId), {
        queueStatus: "idle",
        currentMatchupId: null,
      });
  }

  if (awayUserId) {
    batch.update(db.collection("users").doc(awayUserId), {
        queueStatus: "idle",
        currentMatchupId: null,
      });
  }

  if (homeUserId && homeTeamId) {
    batch.update(
      db.collection("users").doc(homeUserId).collection("teams").doc(homeTeamId),
      {
        matchupId: null,
      },
    );
  }

  if (awayUserId && awayTeamId) {
    batch.update(
      db.collection("users").doc(awayUserId).collection("teams").doc(awayTeamId),
      {
        matchupId: null,
      },
    );
  }

  await batch.commit();

  console.log(`Completed matchup "${matchupId}"`);
};
