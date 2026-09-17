import type { Firestore } from "firebase-admin/firestore";
import { createMatchupDoc } from "../generate/matchup.js";
import type { MatchupDoc, TeamDoc } from "../types/firestore.js";

export type UpsertActiveMatchupOptions = {
  matchupId: string;
  homeUserId: string;
  homeTeamId: string;
  awayUserId: string;
  awayTeamId: string;
  document?: Partial<MatchupDoc>;
};

export type SeededMatchup = {
  id: string;
  document: MatchupDoc;
};

export const upsertActiveMatchup = async (
  db: Firestore,
  options: UpsertActiveMatchupOptions,
): Promise<SeededMatchup> => {
  const {
    matchupId,
    homeUserId,
    homeTeamId,
    awayUserId,
    awayTeamId,
    document = {},
  } = options;
  const homeTeamRef = db
    .collection("users")
    .doc(homeUserId)
    .collection("teams")
    .doc(homeTeamId);
  const awayTeamRef = db
    .collection("users")
    .doc(awayUserId)
    .collection("teams")
    .doc(awayTeamId);
  const [homeTeamSnap, awayTeamSnap] = await Promise.all([
    homeTeamRef.get(),
    awayTeamRef.get(),
  ]);

  if (!homeTeamSnap.exists || !awayTeamSnap.exists) {
    throw new Error(
      "Both team documents must exist before creating a matchup.",
    );
  }

  const homeTeam = homeTeamSnap.data() as TeamDoc;
  const awayTeam = awayTeamSnap.data() as TeamDoc;
  const matchupRef = db.collection("matchups").doc(matchupId);
  const existingMatchupSnap = await matchupRef.get();
  const existingMatchup = existingMatchupSnap.exists
    ? (existingMatchupSnap.data() as Partial<MatchupDoc>)
    : {};
  const matchupDocument = createMatchupDoc(
    homeUserId,
    homeTeamId,
    homeTeam,
    awayUserId,
    awayTeamId,
    awayTeam,
    {
      ...existingMatchup,
      ...document,
      id: matchupId,
      status: "active",
    },
  );
  const batch = db.batch();
  const now = new Date();

  batch.set(matchupRef, matchupDocument);
  batch.update(db.collection("users").doc(homeUserId), {
    queueStatus: "matched",
    currentMatchupId: matchupDocument.id,
    updatedAt: now,
  });
  batch.update(db.collection("users").doc(awayUserId), {
    queueStatus: "matched",
    currentMatchupId: matchupDocument.id,
    updatedAt: now,
  });
  batch.update(homeTeamRef, {
    matchupId: matchupDocument.id,
    updatedAt: now,
  });
  batch.update(awayTeamRef, {
    matchupId: matchupDocument.id,
    updatedAt: now,
  });

  await batch.commit();

  return {
    id: matchupDocument.id,
    document: matchupDocument,
  };
};
