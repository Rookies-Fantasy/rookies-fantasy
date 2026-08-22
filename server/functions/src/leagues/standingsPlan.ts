import { chunk } from "./batching";
import { FIRESTORE_IN_QUERY_LIMIT, MAX_LEAGUE_SIZE } from "./constants";

// One narrowed Firestore read: the teams a single member owns, filtered down to
// the ids the league actually contains.
export type StandingsReadTask = {
  userId: string;
  teamIds: string[];
};

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

// Plans the reads needed to assemble a league's standings.
//
// The previous implementation read each member's entire `users/{uid}/teams`
// subcollection and discarded every doc not in the league — a user in ten
// leagues cost eleven document reads to yield one. Each planned read instead
// filters on `FieldPath.documentId() in [...]`, so only the league's own teams
// are billed. Firestore caps that filter at 30 values, and the member fan-out is
// capped at MAX_LEAGUE_SIZE so a malformed league can't schedule unbounded work.
export const buildStandingsReadPlan = (
  userIds: string[],
  teamIds: string[],
): StandingsReadTask[] => {
  const uniqueTeamIds = dedupe(teamIds);
  const uniqueUserIds = dedupe(userIds).slice(0, MAX_LEAGUE_SIZE);

  if (uniqueTeamIds.length === 0 || uniqueUserIds.length === 0) {
    return [];
  }

  const teamIdChunks = chunk(uniqueTeamIds, FIRESTORE_IN_QUERY_LIMIT);

  return uniqueUserIds.flatMap((userId) =>
    teamIdChunks.map((teamIdChunk) => ({ userId, teamIds: teamIdChunk })),
  );
};
