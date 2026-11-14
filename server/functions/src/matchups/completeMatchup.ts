import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import type { TeamRecord } from "../shared/types";

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
    const isDraw = homeScore === awayScore;
    let winnerId = "";
    if (homeScore > awayScore) {
      winnerId = homeTeamId;
    } else if (awayScore > homeScore) {
      winnerId = awayTeamId;
    }

    const participants = [
      { userId: homeUserId, teamId: homeTeamId, isWin: homeScore > awayScore },
      { userId: awayUserId, teamId: awayTeamId, isWin: awayScore > homeScore },
    ];
    const participantSnapshots = await Promise.all(
      participants.map(async (participant) => {
        const userRef = db.collection("users").doc(participant.userId);
        const teamRef = userRef.collection("teams").doc(participant.teamId);
        const [userDoc, teamDoc] = await Promise.all([
          transaction.get(userRef),
          transaction.get(teamRef),
        ]);
        return { ...participant, userDoc, teamDoc };
      }),
    );

    const updatedAt = new Date();
    transaction.update(currentMatchupDoc.ref, {
      status: "completed",
      homeScore,
      awayScore,
      winnerId,
      updatedAt,
    });

    for (const { isWin, userDoc, teamDoc } of participantSnapshots) {
      const team = teamDoc.data();
      const current = (team?.record ?? {}) as Partial<TeamRecord>;
      const clearTeamMatchup =
        !team?.matchupId || team.matchupId === matchupDoc.id;
      transaction.set(
        teamDoc.ref,
        {
          record: {
            wins: (current.wins ?? 0) + (isWin ? 1 : 0),
            losses: (current.losses ?? 0) + (!isWin && !isDraw ? 1 : 0),
            draws: (current.draws ?? 0) + (isDraw ? 1 : 0),
          },
          ...(clearTeamMatchup ? { matchupId: null } : {}),
          updatedAt,
        },
        { merge: true },
      );

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
