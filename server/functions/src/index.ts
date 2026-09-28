import type { UserRecord } from "firebase-admin/auth";
import { cleanUpDeletedUser } from "./users/deleteUserData";
import * as functions from "firebase-functions/v1";
import {
  EMPTY_PAYLOAD,
  JsonValue,
  LeagueDocument,
  LeagueStandingTeam,
  RawPayload,
} from "./leagues/types";
import {
  evaluateJoinEligibility,
  evaluateUpdateEligibility,
  getOwnerTeamId,
  isLeagueMember,
  JoinRejectionCode,
  recomputeBalance,
  toLeagueDocument,
  toLeagueTeamRefs,
  toRosterCost,
  toStandingTeam,
  UpdateRejectionCode,
  validateCreateLeagueInput,
  validateJoinLeagueInput,
  validateLeagueId,
  validateUpdateLeagueInput,
} from "./leagues/validation";
import { admin, FieldValue } from "./shared/admin";

export { getEarliestGameStartTime } from "./matchups/getEarliestGameStartTime";
export { weeklyMatchupReset } from "./matchups/weeklyMatchupReset";
export { getLiveData } from "./players/getLiveData";
export { updateDailyPlayerData } from "./players/updateDailyPlayerData";
export { processQueue } from "./ranked/processQueue";

export const createUserInDatabase = functions.auth
  .user()
  .onCreate(async (user: UserRecord) => {
    const { uid, email, emailVerified } = user;
    const usersRef = admin.firestore().collection("users");

    if (!email?.trim()) {
      console.error(`${uid} has invalid or missing email`);
      throw new Error("Email is required for user creation.");
    }

    try {
      await usersRef.doc(uid).set({
        id: uid,
        email: email,
        emailVerified: emailVerified,
        queueStatus: "idle",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });

// Cleans up a user's data after their auth account is deleted (in-app
// account deletion, required by App Store guideline 5.1.1(v)).
export const deleteUserData = functions.auth
  .user()
  .onDelete(async (user: UserRecord) => {
    const { uid } = user;

    try {
      const result = await cleanUpDeletedUser(admin.firestore(), uid);
      console.log(
        `Cleaned up deleted user ${uid}: anonymized=${result.anonymized}, ` +
          `leaguesRemovedFrom=${result.leaguesRemovedFrom}, ` +
          `leaguesDeleted=${result.leaguesDeleted}`,
      );
    } catch (error) {
      console.error(`Error cleaning up deleted user ${uid}:`, error);
      throw error;
    }
  });

const LEAGUE_COLLECTION = "leagues";
const USER_COLLECTION = "users";
const TEAM_SUBCOLLECTION = "teams";

// Reads a league document into its typed shape. Returns null when the document
// does not exist, which the eligibility rules treat as "League not found".
// Returns null when the league does not exist. A league that exists but does
// not parse is corrupt — only the server writes these documents — so it throws
// rather than letting the caller act on a half-read league.
const readLeagueDocument = (
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

// The league fields returned to the client. Mirrors `League` in
// client/types/league.ts.
type LeagueResponse = {
  id: string;
  name: string;
  creatorUserId: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  teamIds: string[];
  userIds: string[];
};

const toLeagueResponse = (
  id: string,
  league: LeagueDocument,
): LeagueResponse => ({
  id,
  name: league.name,
  creatorUserId: league.creatorUserId,
  numberOfTeams: league.numberOfTeams,
  budget: league.budget,
  memberCount: league.memberCount,
  teamIds: league.teamIds,
  userIds: league.userIds,
});

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
      teamOwners: { [input.initialTeamId]: uid },
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

// Returns the standings-relevant data for every team in a league.
export const getLeagueStandings = functions.https.onRequest(
  async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).send("Unauthorized");
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      res.status(401).send("Unauthorized");
      return;
    }

    const rawLeagueId = req.query.leagueId;
    const validation = validateLeagueId(
      typeof rawLeagueId === "string" ? rawLeagueId : "",
    );

    if (!validation.valid) {
      res.status(400).send(validation.message);
      return;
    }

    try {
      const db = admin.firestore();
      const leagueSnapshot = await db
        .collection(LEAGUE_COLLECTION)
        .doc(validation.input)
        .get();

      const league = readLeagueDocument(leagueSnapshot);

      if (league === null) {
        res.status(404).send("League not found");
        return;
      }

      // Only members of the league may view its standings.
      if (!isLeagueMember(league, uid)) {
        res.status(403).send("Forbidden");
        return;
      }

      // Each team is read from the member who registered it, so a team doc
      // another user created under a league team's id is never included.
      const teamRefs = toLeagueTeamRefs(league).map(({ teamId, ownerId }) =>
        db
          .collection(USER_COLLECTION)
          .doc(ownerId)
          .collection(TEAM_SUBCOLLECTION)
          .doc(teamId),
      );

      const snapshots =
        teamRefs.length === 0 ? [] : await db.getAll(...teamRefs);

      const teams: LeagueStandingTeam[] = snapshots.flatMap((snapshot) =>
        snapshot.exists
          ? [toStandingTeam(snapshot.id, snapshot.data() ?? EMPTY_PAYLOAD)]
          : [],
      );

      res.json({ teams });
    } catch (err) {
      console.error("Error fetching league standings:", err);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  },
);
