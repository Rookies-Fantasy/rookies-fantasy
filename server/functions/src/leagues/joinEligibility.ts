import { MAX_LEAGUE_SIZE } from "./constants";
import { LeagueDocument } from "./types";

export type JoinRejectionCode =
  | "league-not-found"
  | "team-already-joined"
  | "user-already-joined"
  | "league-full";

export type JoinEligibility =
  | { allowed: true }
  | { allowed: false; code: JoinRejectionCode; message: string };

const reject = (code: JoinRejectionCode, message: string): JoinEligibility => ({
  allowed: false,
  code,
  message,
});

// The preconditions that used to live in the client-side Firestore transaction
// (client/controllers/leagueController.ts). They are enforced here so the league
// document — which getLeagueStandings trusts for its membership gate — can only
// ever be grown by the server.
//
// Messages match the previous client-thrown errors so existing UI copy keeps
// working.
export const evaluateJoinEligibility = (
  league: LeagueDocument | null,
  teamId: string,
  userId: string,
): JoinEligibility => {
  if (league === null) {
    return reject("league-not-found", "League not found");
  }

  if (league.teamIds.includes(teamId)) {
    return reject("team-already-joined", "Team already joined");
  }

  if (league.userIds.includes(userId)) {
    return reject("user-already-joined", "User already joined");
  }

  if (league.memberCount >= league.numberOfTeams) {
    return reject("league-full", "League is full");
  }

  // Hard cap independent of the league's own numberOfTeams. memberCount is only
  // a counter, so the membership arrays are checked too: whichever is furthest
  // along bounds the league.
  const largestMembership = Math.max(
    league.memberCount,
    league.teamIds.length,
    league.userIds.length,
  );

  if (largestMembership >= MAX_LEAGUE_SIZE) {
    return reject("league-full", "League is full");
  }

  return { allowed: true };
};
