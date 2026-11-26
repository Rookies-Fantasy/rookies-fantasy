import * as functions from "firebase-functions/v1";
import { admin, FieldValue } from "../shared/admin";
import {
  LEAGUE_COLLECTION,
  readLeagueDocument,
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
import {
  evaluateUpdateEligibility,
  getOwnerTeamId,
  recomputeBalance,
  toRosterCost,
  type UpdateRejectionCode,
  validateUpdateLeagueInput,
} from "./validation";

const UPDATE_REJECTION_STATUS: Record<
  UpdateRejectionCode,
  functions.https.FunctionsErrorCode
> = {
  "not-league-owner": "permission-denied",
  "below-member-count": "failed-precondition",
  "budget-locked": "failed-precondition",
  "roster-over-budget": "failed-precondition",
};

type OwnerTeamBalance = {
  ref: FirebaseFirestore.DocumentReference;
  balance: number;
};

// Reads the owner's league team inside the update transaction and works out
// its balance under the new budget. Throws when the roster costs more than the
// budget, so neither the league nor the team is written.
const readOwnerTeamBalance = async (
  transaction: FirebaseFirestore.Transaction,
  league: LeagueDocument,
  budget: number,
): Promise<OwnerTeamBalance | null> => {
  const teamId = getOwnerTeamId(league);
  if (teamId === null) {
    return null;
  }

  const teamRef = admin
    .firestore()
    .collection(USER_COLLECTION)
    .doc(league.creatorUserId)
    .collection(TEAM_SUBCOLLECTION)
    .doc(teamId);
  const teamSnapshot = await transaction.get(teamRef);

  if (!teamSnapshot.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Your league team was not found",
    );
  }

  const rosterCost = toRosterCost(teamSnapshot.data() ?? EMPTY_PAYLOAD);
  if (rosterCost === null) {
    console.error(`Team ${teamId} has a malformed lineup or bench`);
    throw new functions.https.HttpsError("internal", "Team data is invalid");
  }

  const recompute = recomputeBalance(budget, rosterCost);
  if (!recompute.allowed) {
    throw new functions.https.HttpsError(
      UPDATE_REJECTION_STATUS[recompute.code],
      recompute.message,
    );
  }

  return { ref: teamRef, balance: recompute.balance };
};

// Updates a league's settings on behalf of its owner.
export const updateLeague = functions.https.onCall(
  async (data: RawPayload, context): Promise<{ league: LeagueResponse }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to edit a league",
      );
    }

    const uid = context.auth.uid;
    const validation = validateUpdateLeagueInput(data ?? EMPTY_PAYLOAD);

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.message,
      );
    }

    const input = validation.input;
    const db = admin.firestore();
    const leagueRef = db.collection(LEAGUE_COLLECTION).doc(input.leagueId);

    try {
      return await db.runTransaction(async (transaction) => {
        // Read inside the transaction so a join landing mid-edit can't slip
        // past the member-count and budget checks.
        const league = readLeagueDocument(await transaction.get(leagueRef));

        if (league === null) {
          throw new functions.https.HttpsError("not-found", "League not found");
        }

        const eligibility = evaluateUpdateEligibility(league, input, uid);

        if (!eligibility.allowed) {
          throw new functions.https.HttpsError(
            UPDATE_REJECTION_STATUS[eligibility.code],
            eligibility.message,
          );
        }

        // Each team's balance starts at the budget, so a budget change has to
        // carry over to the owner's team (the only one in the league, since
        // the budget locks once anyone else joins). Read before any write.
        const ownerTeam =
          input.budget === league.budget
            ? null
            : await readOwnerTeamBalance(transaction, league, input.budget);

        transaction.update(leagueRef, {
          name: input.name,
          numberOfTeams: input.numberOfTeams,
          budget: input.budget,
          updatedAt: FieldValue.serverTimestamp(),
        });

        if (ownerTeam !== null) {
          transaction.update(ownerTeam.ref, {
            balance: ownerTeam.balance,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        return {
          league: toLeagueResponse(input.leagueId, {
            ...league,
            name: input.name,
            numberOfTeams: input.numberOfTeams,
            budget: input.budget,
          }),
        };
      });
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Error updating league:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update league",
      );
    }
  },
);
