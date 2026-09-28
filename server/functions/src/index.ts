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
import { completeMatchup } from "./matchups/completeMatchup";
import { admin, FieldValue } from "./shared/admin";
import { api } from "./shared/balldontlie";
import type { LineupSnapshotItem, TeamSnapshot } from "./shared/types";

export { getLiveData } from "./players/getLiveData";
export { updateDailyPlayerData } from "./players/updateDailyPlayerData";

type MatchupBase = {
  createdAt: Date;
  id: string;
  weekStart: string;
  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  awayScore?: number;
  homeScore?: number;
  winnerId?: string;
};

type RankedMatchup = MatchupBase & {
  leagueId: null;
  status: "active" | "completed";
};

type LeagueMatchup = MatchupBase & {
  leagueId: string;
  week: number;
  phase: "regular" | "playoff";
  status: "scheduled" | "active" | "completed";
};

type Matchup = RankedMatchup | LeagueMatchup;

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

export const processQueue = functions
  .runWith({ secrets: ["BALLDONTLIE_URL", "BALLDONTLIE_API_KEY"] })
  .firestore.document("users/{userId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.queueStatus !== "queued" && after.queueStatus === "queued") {
      try {
        await admin.firestore().runTransaction(async (transaction) => {
          const waitingUsers = await transaction.get(
            admin
              .firestore()
              .collection("users")
              .where("queueStatus", "==", "queued")
              .orderBy("queuedAt", "asc")
              .limit(2),
          );

          if (waitingUsers.size >= 2) {
            const [user1, user2] = waitingUsers.docs;

            if (
              user1.data().queueStatus === "queued" &&
              user2.data().queueStatus === "queued"
            ) {
              const teamId1 = user1.data().teamId;
              const teamId2 = user2.data().teamId;

              if (!teamId1 || !teamId2) {
                console.error(
                  `Cannot create matchup: Missing teamId for user1=${teamId1}, user2=${teamId2}`,
                );
                return;
              }

              transaction.update(user1.ref, {
                queueStatus: "matching",
                updatedAt: FieldValue.serverTimestamp(),
              });

              transaction.update(user2.ref, {
                queueStatus: "matching",
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        });

        const waitingUsers = await admin
          .firestore()
          .collection("users")
          .where("queueStatus", "==", "matching")
          .orderBy("queuedAt", "asc")
          .limit(2)
          .get();

        if (waitingUsers.size >= 2) {
          const [user1, user2] = waitingUsers.docs;

          const teamId1 = user1.data().teamId;
          const teamId2 = user2.data().teamId;

          const matchupId = await createWeeklyMatchup(
            user1.id,
            user2.id,
            teamId1,
            teamId2,
          );

          if (!matchupId) {
            console.error("Failed to create matchup, matchupId is undefined");
            await Promise.all([
              user1.ref.update({ queueStatus: "queued" }),
              user2.ref.update({ queueStatus: "queued" }),
            ]);
            return;
          }

          await Promise.all([
            user1.ref.update({
              currentMatchupId: matchupId,
              queueStatus: "matched",
              updatedAt: FieldValue.serverTimestamp(),
            }),
            user2.ref.update({
              currentMatchupId: matchupId,
              queueStatus: "matched",
              updatedAt: FieldValue.serverTimestamp(),
            }),
          ]);

          console.log(
            `Match created: ${matchupId} between ${user1.id} and ${user2.id}`,
          );
        }

        // TODO: Implement push notifications
      } catch (error) {
        console.error("Error processing queue:", error);
      }
    }
  });

const createWeeklyMatchup = async (
  userId1: string,
  userId2: string,
  teamId1: string,
  teamId2: string,
): Promise<string | undefined> => {
  try {
    const team1Data = await admin
      .firestore()
      .collection("users")
      .doc(userId1)
      .collection("teams")
      .doc(teamId1)
      .get();
    const team2Data = await admin
      .firestore()
      .collection("users")
      .doc(userId2)
      .collection("teams")
      .doc(teamId2)
      .get();

    if (!team1Data.exists || !team2Data.exists) {
      console.error("Team data not found!");
      return undefined;
    }

    const team1Info = team1Data.data();
    const team2Info = team2Data.data();

    if (!team1Info || !team2Info) {
      console.error("Team info is undefined!");
      return undefined;
    }

    const startDate = await getNextMondayDate();
    const matchupRef = admin.firestore().collection("matchups").doc();

    const [team1Augment, team2Augment] = await Promise.all([
      getAugmentSnapshot(team1Info.augmentId),
      getAugmentSnapshot(team2Info.augmentId),
    ]);

    const matchupData: Matchup = {
      id: matchupRef.id,
      leagueId: null,
      createdAt: new Date(),
      weekStart: startDate,
      homeTeamId: teamId1,
      awayTeamId: teamId2,
      homeUserId: userId1,
      awayUserId: userId2,
      awayTeamSnapshot: createTeamSnapshot(team2Info, team2Augment),
      homeTeamSnapshot: createTeamSnapshot(team1Info, team1Augment),
      awayLineupSnapshots: {},
      homeLineupSnapshots: {},
      status: "active",
    };

    await matchupRef.set(matchupData);
    return matchupRef.id;
  } catch (error) {
    console.error("Error creating weekly matchup:", error);
    return undefined;
  }
};

const getAugmentSnapshot = async (augmentId?: string) => {
  if (!augmentId) {
    return undefined;
  }

  const augment = await admin
    .firestore()
    .collection("augments")
    .doc(augmentId)
    .get();

  return augment.exists ? { id: augment.id, ...augment.data() } : undefined;
};

const createTeamSnapshot = (
  teamInfo: any,
  augmentSnapshot?: any,
): TeamSnapshot => ({
  logoUrl: teamInfo.logoUrl,
  name: teamInfo.name,
  record: teamInfo.record,
  lineup: teamInfo.lineup,
  ...(augmentSnapshot ? { augmentSnapshot } : {}),
});

const getNextMondayDate = async (): Promise<string> => {
  const today = new Date();
  const dayOfTheWeek = today.getDay();

  if (dayOfTheWeek === 1) {
    const hasMondayGamesStarted = await checkIfMondayGamesStarted();

    if (!hasMondayGamesStarted) {
      return today.toISOString().split("T")[0];
    } else {
      // Move to next Monday
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + 7);
      return nextMonday.toISOString().split("T")[0];
    }
  }

  const daysUntilMonday = dayOfTheWeek === 0 ? 1 : (8 - dayOfTheWeek) % 7;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
};

const checkIfMondayGamesStarted = async (): Promise<boolean> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const response = await fetch(
      `${process.env.BALLDONTLIE_URL}/games?dates[]=${todayStr}`,
      {
        headers: {
          Authorization: `${process.env.BALLDONTLIE_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.log("Failed fetch for NBA games");
      return true;
    }

    const data: any = await response.json();
    const games = data.data || [];

    if (games.length === 0) {
      return false;
    }

    const earliestGame = new Date(
      Math.min(...games.map((g: any) => new Date(g.status).getTime())),
    );

    const now = new Date();
    return now >= earliestGame;
  } catch (error) {
    console.log("Error checking NBA games:", error);
    return true;
  }
};

// Scheduled function that runs every Monday at 2 AM PDT
// Cron format: "minute hour day-of-month month day-of-week"
// "0 2 * * 1" = Every Monday at 2:00 AM
export const weeklyMatchupReset = functions.pubsub
  .schedule("0 2 * * 1")
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    console.log("Starting weekly matchup reset...");

    try {
      const db = admin.firestore();

      const activeMatchupsSnapshot = await db
        .collection("matchups")
        .where("leagueId", "==", null)
        .where("status", "==", "active")
        .get();

      console.log(
        `Found ${activeMatchupsSnapshot.size} active ranked matchups`,
      );

      const matchupUpdates = activeMatchupsSnapshot.docs.map(
        async (matchupDoc) => {
          const completed = await completeMatchup(db, matchupDoc);
          if (completed) {
            console.log(`Matchup ${matchupDoc.id} completed`);
          }
        },
      );

      await Promise.all(matchupUpdates);

      console.log("Weekly matchup reset completed successfully");
    } catch (error) {
      console.error("Error during weekly matchup reset:", error);
      throw error;
    }
  });

type EarliestGameCacheEntry = {
  earliestGameStart: string;
  fetchedAt: number;
};

const earliestGameCache: Record<string, EarliestGameCacheEntry> = {};
const DAY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getEarliestGameStartTime = functions.https.onRequest(
  async (req, res) => {
    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).send("Unauthorized");
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).send("Unauthorized");
      return;
    }

    const { date } = req.query;

    if (!date || typeof date !== "string" || !isValidISODate(date)) {
      res.status(400).send("Invalid date. Expected YYYY-MM-DD");
      return;
    }

    const now = Date.now();
    const cached = earliestGameCache[date];

    if (cached && now - cached.fetchedAt < DAY_CACHE_TTL_MS) {
      console.log(`Fetched earliest game time for ${date} from cache`);
      res.json({
        date,
        earliestGameStart: cached.earliestGameStart,
        cached: true,
      });
      return;
    }

    try {
      console.log(`Fetching earliest game time for ${date} from API`);

      const { data } = await api.nba.getGames({
        dates: [date],
      });

      if (!data || data.length === 0) {
        res.status(200).json({ earliestGameStart: null });
        return;
      }

      let earliest: Date | null = null;

      for (const game of data) {
        // Quick type fix by casting to any, as the balldontlie API docs has the attribute listed as "date",
        // but "datetime" is what's actually returned.
        if (!(game as any).datetime) continue;

        const dt = new Date((game as any).datetime);
        if (!earliest || dt < earliest) {
          earliest = dt;
        }
      }

      if (!earliest) {
        res.status(500).send("No valid game times found");
        return;
      }

      // Cache result
      earliestGameCache[date] = {
        earliestGameStart: earliest.toISOString(),
        fetchedAt: now,
      };

      res.json({
        date,
        earliestGameStart: earliest.toISOString(),
        cached: false,
      });
    } catch (err) {
      console.error("Error fetching NBA games:", err);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  },
);

const isValidISODate = (value: string): boolean => {
  // Matches YYYY-MM-DD and ensures it's a real date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
};

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
