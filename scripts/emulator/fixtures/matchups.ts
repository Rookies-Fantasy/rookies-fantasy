import type {
  DocumentSnapshot,
  Firestore,
  WriteBatch,
} from "firebase-admin/firestore";
import {
  createLeagueMatchupDoc,
  createMatchupDoc,
  type LeagueMatchupPlacement,
  type MatchupSides,
} from "../generate/matchup.js";
import type {
  LeagueMatchupDoc,
  MatchupDoc,
  RankedMatchupDoc,
  TeamDoc,
} from "../types/firestore.js";

export type UpsertActiveMatchupOptions = {
  matchupId?: string;
  homeUserId: string;
  homeTeamId: string;
  awayUserId: string;
  awayTeamId: string;
  document?: Partial<RankedMatchupDoc>;
};

export type SeededMatchup = {
  id: string;
  document: RankedMatchupDoc;
};

export type StageLeagueMatchupOptions = MatchupSides &
  LeagueMatchupPlacement & {
    matchupId: string;
    document?: Partial<LeagueMatchupDoc>;
  };

export const getActiveMatchups = async (
  db: Firestore,
  matchupId?: string,
): Promise<DocumentSnapshot[]> => {
  if (matchupId) {
    const doc = await db.collection("matchups").doc(matchupId).get();
    if (!doc.exists) {
      throw new Error(`Matchup "${matchupId}" not found.`);
    }

    const matchup = doc.data() as MatchupDoc;
    if (matchup.status !== "active") {
      console.warn(
        `Matchup "${matchupId}" is already ${matchup.status}. Skipping simulation.`,
      );
      return [];
    }

    return [doc];
  }

  const matchups = await db
    .collection("matchups")
    .where("status", "==", "active")
    .get();
  return matchups.docs;
};

export const resolveSeedMatchupId = async (
  db: Firestore,
  options: UpsertActiveMatchupOptions,
): Promise<string> => {
  if (options.matchupId) return options.matchupId;

  const users = await Promise.all([
    db.collection("users").doc(options.homeUserId).get(),
    db.collection("users").doc(options.awayUserId).get(),
  ]);
  const candidates = new Set<string>();
  for (const user of users) {
    const id = user.data()?.currentMatchupId;
    if (typeof id === "string" && id) candidates.add(id);
  }
  for (const id of candidates) {
    const matchup = await db.collection("matchups").doc(id).get();
    const data = matchup.data();
    if (
      data?.status === "active" &&
      data.homeUserId === options.homeUserId &&
      data.awayUserId === options.awayUserId &&
      data.homeTeamId === options.homeTeamId &&
      data.awayTeamId === options.awayTeamId
    ) {
      return matchup.id;
    }
  }
  return db.collection("matchups").doc().id;
};

export const stageActiveMatchup = (
  db: Firestore,
  batch: WriteBatch,
  options: UpsertActiveMatchupOptions & {
    matchupId: string;
    homeTeam: TeamDoc;
    awayTeam: TeamDoc;
  },
): RankedMatchupDoc => {
  const matchupDocument = createMatchupDoc(
    {
      homeUserId: options.homeUserId,
      homeTeamId: options.homeTeamId,
      homeTeam: options.homeTeam,
      awayUserId: options.awayUserId,
      awayTeamId: options.awayTeamId,
      awayTeam: options.awayTeam,
    },
    { ...options.document, id: options.matchupId, status: "active" },
  );
  batch.set(db.collection("matchups").doc(options.matchupId), matchupDocument);
  return matchupDocument;
};

export const stageLeagueMatchup = (
  db: Firestore,
  batch: WriteBatch,
  options: StageLeagueMatchupOptions,
): LeagueMatchupDoc => {
  const { matchupId, leagueId, week, phase, document, ...sides } = options;
  const matchupDocument = createLeagueMatchupDoc(
    sides,
    { leagueId, week, phase },
    { ...document, id: matchupId },
  );
  batch.set(db.collection("matchups").doc(matchupId), matchupDocument);
  return matchupDocument;
};

export const upsertActiveMatchup = async (
  db: Firestore,
  options: UpsertActiveMatchupOptions,
): Promise<SeededMatchup> => {
  const {
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
  const matchupId = await resolveSeedMatchupId(db, options);
  const matchupRef = db.collection("matchups").doc(matchupId);
  const existingMatchupSnap = await matchupRef.get();
  const existingMatchup = existingMatchupSnap.exists
    ? (existingMatchupSnap.data() as Partial<RankedMatchupDoc>)
    : {};
  const batch = db.batch();
  const now = new Date();

  const matchupDocument = stageActiveMatchup(db, batch, {
    matchupId,
    homeUserId,
    homeTeamId,
    homeTeam,
    awayUserId,
    awayTeamId,
    awayTeam,
    document: { ...existingMatchup, ...document },
  });
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
