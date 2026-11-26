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
  type JsonValue,
  type LeagueResponse,
  type RawPayload,
} from "./types";
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

// The team fields returned to the client. The client fills the empty lineup
// and bench from its own defaults, exactly as it would for a fresh team read.
type JoinedTeamResponse = {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  balance: number;
  isLeagueTeam: boolean;
};

// Finds which of the league's teams belongs to the caller. Team ids are only
// unique within a user's own subcollection, so each league team id is looked
// up under the caller's path; at most MAX_TEAMS reads in one round trip.
// Returns null when none match, e.g. a membership written by an older client
// whose team was later deleted.
const findCallerLeagueTeam = async (
  transaction: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  uid: string,
  leagueTeamIds: string[],
): Promise<JoinedTeamResponse | null> => {
  if (leagueTeamIds.length === 0) {
    return null;
  }

  const teamsRef = db
    .collection(USER_COLLECTION)
    .doc(uid)
    .collection(TEAM_SUBCOLLECTION);
  const snapshots = await transaction.getAll(
    ...leagueTeamIds.map((teamId) => teamsRef.doc(teamId)),
  );
  const match = snapshots.find((snapshot) => snapshot.exists) ?? null;

  return match === null ? null : toJoinedTeamResponse(match);
};

const readString = (value: JsonValue, fallback: string): string =>
  typeof value === "string" ? value : fallback;

// Team documents can also be written by the client, so every field falls back
// to a typed default instead of trusting the stored shape.
const toJoinedTeamResponse = (
  snapshot: FirebaseFirestore.DocumentSnapshot,
): JoinedTeamResponse => {
  const data: RawPayload = snapshot.data() ?? EMPTY_PAYLOAD;
  const { balance, isLeagueTeam } = data;

  return {
    id: snapshot.id,
    name: readString(data.name, ""),
    abbreviation: readString(data.abbreviation, ""),
    logoUrl: readString(data.logoUrl, ""),
    balance:
      typeof balance === "number" && Number.isFinite(balance) ? balance : 0,
    isLeagueTeam: typeof isLeagueTeam === "boolean" ? isLeagueTeam : true,
  };
};

// Creates the caller's league team and adds it to the league as one
// transaction. Either both writes land or neither does, so a rejected join
// (league full, already a member, ...) never leaves an orphaned team document,
// and a team can never exist half-joined.
export const joinLeague = functions.https.onCall(
  async (
    data: RawPayload,
    context,
  ): Promise<{ league: LeagueResponse; team: JoinedTeamResponse }> => {
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

    const { leagueId, team } = validation.input;
    const db = admin.firestore();
    const leagueRef = db.collection(LEAGUE_COLLECTION).doc(leagueId);
    // Allocating the id is local — nothing is written until the transaction
    // commits.
    const teamRef = db
      .collection(USER_COLLECTION)
      .doc(uid)
      .collection(TEAM_SUBCOLLECTION)
      .doc();

    try {
      return await db.runTransaction(async (transaction) => {
        const league = readLeagueDocument(await transaction.get(leagueRef));

        if (league === null) {
          throw new functions.https.HttpsError("not-found", "League not found");
        }

        // A repeat join from a member is answered with their existing team
        // rather than an error. This is what makes a retry safe when the
        // response to a committed join was lost: the client gets the same
        // result it missed, and nothing new is written.
        if (league.userIds.includes(uid)) {
          const existingTeam = await findCallerLeagueTeam(
            transaction,
            db,
            uid,
            league.teamIds,
          );

          if (existingTeam !== null) {
            return {
              league: toLeagueResponse(leagueId, league),
              team: existingTeam,
            };
          }
        }

        const eligibility = evaluateJoinEligibility(league, teamRef.id, uid);

        if (!eligibility.allowed) {
          throw new functions.https.HttpsError(
            JOIN_REJECTION_STATUS[eligibility.code],
            eligibility.message,
          );
        }

        // Same shape UserController.addUserTeam writes, except the balance is
        // the league budget decided here rather than a value the client sends.
        transaction.create(teamRef, {
          name: team.name,
          abbreviation: team.abbreviation,
          logoUrl: team.logoUrl,
          balance: league.budget,
          isLeagueTeam: true,
          record: { wins: 0, losses: 0, draws: 0 },
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.update(leagueRef, {
          memberCount: FieldValue.increment(1),
          teamIds: FieldValue.arrayUnion(teamRef.id),
          userIds: FieldValue.arrayUnion(uid),
          // Auto-generated doc ids never contain ".", so this field path is
          // always a single key in the map.
          [`teamOwners.${teamRef.id}`]: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          league: toLeagueResponse(leagueId, {
            ...league,
            memberCount: league.memberCount + 1,
            teamIds: [...league.teamIds, teamRef.id],
            userIds: [...league.userIds, uid],
            teamOwners: { ...league.teamOwners, [teamRef.id]: uid },
          }),
          team: {
            id: teamRef.id,
            name: team.name,
            abbreviation: team.abbreviation,
            logoUrl: team.logoUrl,
            balance: league.budget,
            isLeagueTeam: true,
          },
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
