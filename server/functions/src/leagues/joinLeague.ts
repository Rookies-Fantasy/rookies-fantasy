import * as functions from "firebase-functions/v1";
import { admin, FieldValue } from "../shared/admin";
import {
  LEAGUE_COLLECTION,
  readLeagueDocument,
  TEAM_SUBCOLLECTION,
  toLeagueResponse,
  USER_COLLECTION,
} from "./leagueDocuments";
import { EMPTY_PAYLOAD, type LeagueResponse, type RawPayload } from "./types";
import {
  evaluateJoinEligibility,
  type JoinRejectionCode,
  validateJoinLeagueInput,
} from "./validation";

const JOIN_REJECTION_STATUS: Record<
  JoinRejectionCode,
  functions.https.FunctionsErrorCode
> = {
  "team-already-joined": "already-exists",
  "user-already-joined": "already-exists",
  "league-full": "resource-exhausted",
};

// Adds the caller's team to a league.
export const joinLeague = functions.https.onCall(
  async (data: RawPayload, context): Promise<{ league: LeagueResponse }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to join a league",
      );
    }

    const uid = context.auth.uid;
    const validation = validateJoinLeagueInput(data ?? EMPTY_PAYLOAD);

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.message,
      );
    }

    const { leagueId, teamId } = validation.input;
    const db = admin.firestore();
    const leagueRef = db.collection(LEAGUE_COLLECTION).doc(leagueId);
    const teamRef = db
      .collection(USER_COLLECTION)
      .doc(uid)
      .collection(TEAM_SUBCOLLECTION)
      .doc(teamId);

    try {
      return await db.runTransaction(async (transaction) => {
        // All reads must precede writes inside a Firestore transaction.
        // getAll fetches both documents in a single round trip.
        const [leagueSnapshot, teamSnapshot] = await transaction.getAll(
          leagueRef,
          teamRef,
        );

        if (!teamSnapshot.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "Team not found for the signed-in user",
          );
        }

        const league = readLeagueDocument(leagueSnapshot);

        if (league === null) {
          throw new functions.https.HttpsError("not-found", "League not found");
        }

        const eligibility = evaluateJoinEligibility(league, teamId, uid);

        if (!eligibility.allowed) {
          throw new functions.https.HttpsError(
            JOIN_REJECTION_STATUS[eligibility.code],
            eligibility.message,
          );
        }

        transaction.update(leagueRef, {
          memberCount: FieldValue.increment(1),
          teamIds: FieldValue.arrayUnion(teamId),
          userIds: FieldValue.arrayUnion(uid),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          league: toLeagueResponse(leagueId, {
            ...league,
            memberCount: league.memberCount + 1,
            teamIds: [...league.teamIds, teamId],
            userIds: [...league.userIds, uid],
          }),
        };
      });
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Error joining league:", error);
      throw new functions.https.HttpsError("internal", "Failed to join league");
    }
  },
);
