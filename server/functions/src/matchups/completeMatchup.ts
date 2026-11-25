import type {
  DocumentData,
  DocumentSnapshot,
  Firestore,
} from "firebase-admin/firestore";
import { DELETED_USER_STATUS } from "../users/cleanUpDeletedUser";

type ScoreSnapshot = {
  playerSnapshot?: {
    gameStats?: {
      fantasyPoints?: number;
    };
  };
};

type MatchupCompletionData = {
  status: "active" | "completed";
  homeUserId: string;
  awayUserId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeLineupSnapshots?: Record<string, ScoreSnapshot[]>;
  awayLineupSnapshots?: Record<string, ScoreSnapshot[]>;
};

type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

const sumFantasyPoints = (snapshots: Record<string, ScoreSnapshot[]> = {}) =>
  Object.values(snapshots).reduce(
    (total, day) =>
      total +
      day.reduce(
        (dayTotal, slot) =>
          dayTotal + (slot.playerSnapshot?.gameStats?.fantasyPoints ?? 0),
        0,
      ),
    0,
  );

type MatchupSide = {
  teamId: string;
  score: number;
  isDeleted: boolean;
};

type MatchupResult = {
  // Winning team id, or "" for a draw (or when both sides were deleted).
  winnerId: string;
  // Teams whose owner deleted their account before the matchup ended.
  forfeitedTeamIds: string[];
};

// A user whose account was deleted, or whose profile no longer exists at all
// (accounts removed before deleted users were flagged instead).
export const isDeletedUser = (user: DocumentData | undefined): boolean =>
  !user || user.status === DELETED_USER_STATUS;

// Decides the result. If one owner deleted their account, their team forfeits
// and the opponent wins regardless of score. If both did, nobody wins.
export const getMatchupResult = (
  home: MatchupSide,
  away: MatchupSide,
): MatchupResult => {
  const forfeitedTeamIds = [home, away]
    .filter((side) => side.isDeleted)
    .map((side) => side.teamId);

  if (home.isDeleted && away.isDeleted) {
    return { winnerId: "", forfeitedTeamIds };
  }
  if (home.isDeleted) {
    return { winnerId: away.teamId, forfeitedTeamIds };
  }
  if (away.isDeleted) {
    return { winnerId: home.teamId, forfeitedTeamIds };
  }

  let winnerId = "";
  if (home.score > away.score) {
    winnerId = home.teamId;
  } else if (away.score > home.score) {
    winnerId = away.teamId;
  }
  return { winnerId, forfeitedTeamIds };
};

export const completeMatchup = async (
  db: Firestore,
  matchupDoc: DocumentSnapshot,
): Promise<boolean> =>
  db.runTransaction(async (transaction) => {
    // Re-read inside the transaction so retries cannot count a result twice.
    const currentMatchupDoc = await transaction.get(matchupDoc.ref);
    if (!currentMatchupDoc.exists) {
      throw new Error(`Matchup "${matchupDoc.id}" not found.`);
    }

    const matchup = currentMatchupDoc.data() as MatchupCompletionData;
    if (matchup.status === "completed") {
      return false;
    }
    if (matchup.status !== "active") {
      throw new Error(`Matchup "${matchupDoc.id}" is not active.`);
    }

    const { homeUserId, awayUserId, homeTeamId, awayTeamId } = matchup;
    if (
      ![homeUserId, awayUserId, homeTeamId, awayTeamId].every(
        (id) => typeof id === "string" && id.length > 0,
      ) ||
      homeUserId === awayUserId
    ) {
      throw new Error(`Matchup "${matchupDoc.id}" has invalid participants.`);
    }

    const homeScore = sumFantasyPoints(matchup.homeLineupSnapshots);
    const awayScore = sumFantasyPoints(matchup.awayLineupSnapshots);

    const sides = [
      { userId: homeUserId, teamId: homeTeamId, score: homeScore },
      { userId: awayUserId, teamId: awayTeamId, score: awayScore },
    ];
    const participantSnapshots = await Promise.all(
      sides.map(async (side) => {
        const userRef = db.collection("users").doc(side.userId);
        const teamRef = userRef.collection("teams").doc(side.teamId);
        const [userDoc, teamDoc] = await Promise.all([
          transaction.get(userRef),
          transaction.get(teamRef),
        ]);
        return {
          ...side,
          userDoc,
          teamDoc,
          isDeleted: isDeletedUser(userDoc.data()),
        };
      }),
    );

    const [home, away] = participantSnapshots;
    const result = getMatchupResult(home, away);

    const updatedAt = new Date();
    transaction.update(currentMatchupDoc.ref, {
      status: "completed",
      homeScore,
      awayScore,
      winnerId: result.winnerId,
      forfeitedTeamIds: result.forfeitedTeamIds,
      updatedAt,
    });

    for (const participant of participantSnapshots) {
      // A deleted user's records and profile stay as they were.
      if (participant.isDeleted) {
        continue;
      }

      const { userDoc, teamDoc, teamId } = participant;
      const isWin = result.winnerId === teamId;
      const isDraw = result.winnerId === "";

      // Never recreate a team document that no longer exists.
      const team = teamDoc.data();
      if (teamDoc.exists && team) {
        const current = (team.record ?? {}) as Partial<TeamRecord>;
        const clearTeamMatchup =
          !team.matchupId || team.matchupId === matchupDoc.id;
        transaction.update(teamDoc.ref, {
          record: {
            wins: (current.wins ?? 0) + (isWin ? 1 : 0),
            losses: (current.losses ?? 0) + (!isWin && !isDraw ? 1 : 0),
            draws: (current.draws ?? 0) + (isDraw ? 1 : 0),
          },
          ...(clearTeamMatchup ? { matchupId: null } : {}),
          updatedAt,
        });
      } else {
        console.warn(
          `Matchup ${matchupDoc.id}: team ${teamId} not found, record not updated`,
        );
      }

      const user = userDoc.data();
      if (
        !user ||
        (user.currentMatchupId && user.currentMatchupId !== matchupDoc.id) ||
        (user.queueStatus === "queued" &&
          user.currentMatchupId !== matchupDoc.id)
      ) {
        continue;
      }

      // Replace the fresh document to remove queuedAt and preserve other fields.
      const { queuedAt: _queuedAt, ...userFields } = user;
      transaction.set(userDoc.ref, {
        ...userFields,
        queueStatus: "idle",
        currentMatchupId: null,
        updatedAt,
      });
    }

    return true;
  });
