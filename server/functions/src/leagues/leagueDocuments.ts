import * as functions from "firebase-functions/v1";
import {
  EMPTY_PAYLOAD,
  type LeagueDocument,
  type LeagueResponse,
} from "./types";
import { toLeagueDocument } from "./validation";

export const LEAGUE_COLLECTION = "leagues";
export const USER_COLLECTION = "users";
export const TEAM_SUBCOLLECTION = "teams";

// Reads a league document into its typed shape. Returns null when the league
// doesn't exist. A league that exists but doesn't parse is corrupt (only the
// server writes these documents), so it throws instead of letting the caller
// act on a half-read league.
export const readLeagueDocument = (
  snapshot: FirebaseFirestore.DocumentSnapshot,
): LeagueDocument | null => {
  if (!snapshot.exists) {
    return null;
  }

  const league = toLeagueDocument(snapshot.data() ?? EMPTY_PAYLOAD);

  if (league === null) {
    console.error(`League ${snapshot.id} is missing or has malformed fields`);
    throw new functions.https.HttpsError("internal", "League data is invalid");
  }

  return league;
};

export const toLeagueResponse = (
  id: string,
  league: LeagueDocument,
): LeagueResponse => ({
  id,
  name: league.name,
  numberOfTeams: league.numberOfTeams,
  budget: league.budget,
  memberCount: league.memberCount,
  teamIds: league.teamIds,
  userIds: league.userIds,
});
