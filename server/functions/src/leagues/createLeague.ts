import * as functions from "firebase-functions/v1";
import { admin, FieldValue } from "../shared/admin";
import {
  LEAGUE_COLLECTION,
  TEAM_SUBCOLLECTION,
  toLeagueResponse,
  USER_COLLECTION,
} from "./leagueDocuments";
import {
  EMPTY_PAYLOAD,
  type LeagueDocument,
  type LeagueResponse,
  type RawPayload,
} from "./types";
import { validateCreateLeagueInput } from "./validation";

// Creates a league on behalf of the caller.
export const createLeague = functions.https.onCall(
  async (data: RawPayload, context): Promise<{ league: LeagueResponse }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to create a league",
      );
    }

    const uid = context.auth.uid;
    const validation = validateCreateLeagueInput(data ?? EMPTY_PAYLOAD);

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.message,
      );
    }

    const input = validation.input;
    const db = admin.firestore();

    // The initial team must belong to the caller, otherwise a league could be
    // seeded with somebody else's team id.
    const teamDoc = await db
      .collection(USER_COLLECTION)
      .doc(uid)
      .collection(TEAM_SUBCOLLECTION)
      .doc(input.initialTeamId)
      .get();

    if (!teamDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Team not found for the signed-in user",
      );
    }

    const leagueRef = db.collection(LEAGUE_COLLECTION).doc();
    const league: LeagueDocument = {
      name: input.name,
      creatorUserId: uid,
      numberOfTeams: input.numberOfTeams,
      budget: input.budget,
      memberCount: 1,
      teamIds: [input.initialTeamId],
      userIds: [uid],
    };

    try {
      await leagueRef.set({
        ...league,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating league:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create league",
      );
    }

    return { league: toLeagueResponse(leagueRef.id, league) };
  },
);
