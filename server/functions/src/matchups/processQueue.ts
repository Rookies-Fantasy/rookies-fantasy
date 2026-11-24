import {
  DocumentData,
  DocumentReference,
  FieldValue,
  Firestore,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { DELETED_USER_STATUS } from "../users/deleteUserData";

// How many of the oldest queued users one run inspects. Invalid entries are
// moved out of the queue, so a larger window lets one run skip past them.
const QUEUE_SCAN_LIMIT = 10;

type QueueCandidate = {
  userRef: DocumentReference;
  userId: string;
  teamId: string;
  team: DocumentData;
};

export type PairQueueResult =
  | { status: "matched"; matchupId: string; userIds: [string, string] }
  | { status: "waiting"; removedUserIds: string[] };

const leaveQueueFields = () => ({
  queueStatus: "idle",
  queuedAt: FieldValue.delete(),
  updatedAt: FieldValue.serverTimestamp(),
});

const getAugmentSnapshot = async (
  db: Firestore,
  transaction: Transaction,
  augmentId: string | null,
): Promise<DocumentData | null> => {
  if (!augmentId) return null;
  const augment = await transaction.get(
    db.collection("augments").doc(augmentId),
  );
  return augment.exists ? { id: augment.id, ...augment.data() } : null;
};

const createTeamSnapshot = (
  team: DocumentData,
  augmentSnapshot: DocumentData | null,
): DocumentData => ({
  logoUrl: team.logoUrl,
  name: team.name,
  record: team.record ?? { wins: 0, losses: 0, draws: 0 },
  lineup: team.lineup,
  ...(augmentSnapshot ? { augmentSnapshot } : {}),
});

// Returns the team a queued user wants to play with, or null when the entry
// can never be matched: the account was deleted or no team ID is set.
export const getQueuedTeamId = (user: DocumentData): string | null => {
  if (user.status === DELETED_USER_STATUS) return null;
  const teamId = user.teamId;
  return typeof teamId === "string" && teamId.length > 0 ? teamId : null;
};

// Validates a queued user. Returns null when the entry can never be matched
// (deleted account, no team ID, or the team no longer exists).
const readCandidate = async (
  transaction: Transaction,
  userDoc: QueryDocumentSnapshot,
): Promise<QueueCandidate | null> => {
  const teamId = getQueuedTeamId(userDoc.data());
  if (teamId === null) return null;

  const teamDoc = await transaction.get(
    userDoc.ref.collection("teams").doc(teamId),
  );
  const team = teamDoc.data();
  if (!teamDoc.exists || !team) return null;

  return { userRef: userDoc.ref, userId: userDoc.id, teamId, team };
};

// Pairs the two oldest valid queued users and creates their ranked matchup in
// one transaction, so concurrent runs cannot pair the same user twice. Queue
// entries that can never be matched are moved back to idle.
//
// If the matchup cannot be created, both users are moved to idle (not back to
// queued), so a failure cannot re-trigger the queue in a loop.
export const pairQueuedUsers = async (
  db: Firestore,
  getWeekStart: () => Promise<string>,
): Promise<PairQueueResult> => {
  let weekStart: string | null = null;
  let candidates: QueueCandidate[] = [];

  try {
    return await db.runTransaction(async (transaction) => {
      candidates = [];
      const queued = await transaction.get(
        db
          .collection("users")
          .where("queueStatus", "==", "queued")
          .orderBy("queuedAt", "asc")
          .limit(QUEUE_SCAN_LIMIT),
      );

      const invalid: QueryDocumentSnapshot[] = [];
      for (const userDoc of queued.docs) {
        if (candidates.length === 2) break;
        const candidate = await readCandidate(transaction, userDoc);
        if (candidate) {
          candidates.push(candidate);
        } else {
          invalid.push(userDoc);
        }
      }

      if (candidates.length < 2) {
        for (const userDoc of invalid) {
          transaction.update(userDoc.ref, leaveQueueFields());
        }
        return {
          status: "waiting",
          removedUserIds: invalid.map((doc) => doc.id),
        };
      }

      const [home, away] = candidates;
      const [homeAugment, awayAugment] = await Promise.all([
        getAugmentSnapshot(db, transaction, home.team.augmentId ?? null),
        getAugmentSnapshot(db, transaction, away.team.augmentId ?? null),
      ]);
      weekStart ??= await getWeekStart();

      // All reads are done; writes follow.
      for (const userDoc of invalid) {
        transaction.update(userDoc.ref, leaveQueueFields());
      }

      const matchupRef = db.collection("matchups").doc();
      transaction.set(matchupRef, {
        id: matchupRef.id,
        createdAt: new Date(),
        weekStart,
        // Ranked matchups have no league.
        leagueId: null,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        homeUserId: home.userId,
        awayUserId: away.userId,
        homeTeamSnapshot: createTeamSnapshot(home.team, homeAugment),
        awayTeamSnapshot: createTeamSnapshot(away.team, awayAugment),
        homeLineupSnapshots: {},
        awayLineupSnapshots: {},
        status: "active",
      });

      for (const { userRef } of candidates) {
        transaction.update(userRef, {
          currentMatchupId: matchupRef.id,
          queueStatus: "matched",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        status: "matched",
        matchupId: matchupRef.id,
        userIds: [home.userId, away.userId],
      };
    });
  } catch (error) {
    const userIds = candidates.map((candidate) => candidate.userId);
    console.error(
      `Failed to create matchup for users [${userIds.join(", ")}]. Moving them out of the queue.`,
      error,
    );
    await removeFromQueue(
      db,
      candidates.map((candidate) => candidate.userRef),
    );
    throw error;
  }
};

// Moves users that are still queued back to idle.
const removeFromQueue = async (
  db: Firestore,
  userRefs: DocumentReference[],
): Promise<void> => {
  if (userRefs.length === 0) return;
  try {
    await db.runTransaction(async (transaction) => {
      const users = await transaction.getAll(...userRefs);
      for (const user of users) {
        if (user.data()?.queueStatus === "queued") {
          transaction.update(user.ref, leaveQueueFields());
        }
      }
    });
  } catch (error) {
    console.error("Failed to move users out of the queue:", error);
  }
};
