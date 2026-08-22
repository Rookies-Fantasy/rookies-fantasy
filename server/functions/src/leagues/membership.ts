import { LeagueDocument } from "./types";

// The access gate for league-scoped reads. It is only sound because league
// membership is now written exclusively by the joinLeague / createLeague
// callables — while clients could write `leagues/{id}` directly, any
// authenticated user could arrayUnion their own uid here and read every member's
// private team data.
export const isLeagueMember = (
  league: LeagueDocument,
  userId: string,
): boolean => userId.length > 0 && league.userIds.includes(userId);
