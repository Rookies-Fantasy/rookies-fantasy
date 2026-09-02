import { chunk } from "./batching";
import { MAX_TEAMS } from "./types";

// Firestore allows at most 30 values in an `in` / `documentId() in` filter.
export const FIRESTORE_IN_QUERY_LIMIT = 30;

// How many member reads may be in flight at once during the standings fan-out.
export const STANDINGS_FANOUT_CONCURRENCY = 10;

// One narrowed Firestore read: the teams a single member owns, filtered down to
// the ids the league actually contains.
export type StandingsReadTask = {
  userId: string;
  teamIds: string[];
};

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

// Plans the reads needed to assemble a league's standings.
//
// Reading each member's entire `users/{uid}/teams` subcollection and discarding
// every doc not in the league would bill a user in ten leagues eleven document
// reads to yield one. Each planned read instead filters on
// `FieldPath.documentId() in [...]`, so only the league's own teams are read.
// Firestore caps that filter at 30 values, and the member fan-out is capped at
// MAX_TEAMS — the ceiling createLeague enforces on numberOfTeams — so a
// malformed league can't schedule unbounded work.
export const buildStandingsReadPlan = (
  userIds: string[],
  teamIds: string[],
): StandingsReadTask[] => {
  const uniqueTeamIds = dedupe(teamIds);
  const uniqueUserIds = dedupe(userIds).slice(0, MAX_TEAMS);

  if (uniqueTeamIds.length === 0 || uniqueUserIds.length === 0) {
    return [];
  }

  const teamIdChunks = chunk(uniqueTeamIds, FIRESTORE_IN_QUERY_LIMIT);

  return uniqueUserIds.flatMap((userId) =>
    teamIdChunks.map((teamIdChunk) => ({ userId, teamIds: teamIdChunk })),
  );
};
