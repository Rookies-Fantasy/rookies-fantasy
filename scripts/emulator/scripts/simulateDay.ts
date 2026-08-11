import type {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { calculateFantasyPoints } from "../../../client/utils/fantasyPoints.js";
import type {
  GameInfo,
  GameStats,
  LineupSnapshotItem,
  Matchup,
  PlayerSnapshot,
} from "../../../client/types/matchup";
import type { TeamLineupSlot } from "../../../client/types/team";

const DEFAULT_OPPONENT = "Simulated Opponent";

const parseDate = (value?: string): string => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().split("T")[0];
};

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000000;
  }
  return hash;
};

const buildStats = (playerId: string, date: string): GameStats => {
  const hash = hashString(`${playerId}-${date}`);
  const points = 10 + (hash % 25);
  const rebounds = 2 + ((hash >> 2) % 12);
  const assists = 1 + ((hash >> 3) % 10);
  const steals = hash % 3;
  const blocks = (hash >> 1) % 3;
  const turnovers = hash % 5;
  const minutes = 18 + (hash % 20);

  return {
    points,
    assists,
    rebounds,
    steals,
    blocks,
    turnovers,
    minutes,
    fantasyPoints: calculateFantasyPoints({
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      minutes,
      fantasyPoints: 0,
    }),
  };
};

const buildGameInfo = (date: string, isHome: boolean): GameInfo => ({
  gameStatus: true,
  opponent: DEFAULT_OPPONENT,
  gameDate: date,
  isHome,
});

const buildSnapshot = (
  lineup: TeamLineupSlot[],
  date: string,
  isHome: boolean,
): LineupSnapshotItem[] =>
  lineup.flatMap((slot) => {
    if (!slot.player) return [];

    const stats = buildStats(slot.player.id, date);
    const gameInfo = buildGameInfo(date, isHome);
    const playerSnapshot: PlayerSnapshot = {
      firstName: slot.player.firstName,
      lastName: slot.player.lastName,
      headshotUrl: slot.player.headshotUrl,
      positions: slot.player.positions,
      salary: slot.player.salary,
      id: slot.player.id,
      gameInfo,
      gameStats: stats,
    };

    return [
      {
        position: slot.position,
        playerSnapshot,
      },
    ];
  });

const sumFantasyPoints = (snapshots: LineupSnapshotItem[]): number =>
  snapshots.reduce(
    (total, slot) => total + (slot.playerSnapshot.gameStats?.fantasyPoints ?? 0),
    0,
  );

const updateMatchup = async (
  db: Firestore,
  matchupDoc: QueryDocumentSnapshot<DocumentData>,
  date: string,
) => {
  const matchup = matchupDoc.data() as Matchup;

  if (matchup.homeLineupSnapshots?.[date] || matchup.awayLineupSnapshots?.[date]) {
    console.log(`Matchup ${matchupDoc.id} already has snapshots for ${date}. Skipping.`);
    return;
  }

  const [homeTeamSnap, awayTeamSnap] = await Promise.all([
    db
      .collection("users")
      .doc(matchup.homeUserId)
      .collection("teams")
      .doc(matchup.homeTeamId)
      .get(),
    db
      .collection("users")
      .doc(matchup.awayUserId)
      .collection("teams")
      .doc(matchup.awayTeamId)
      .get(),
  ]);

  const homeTeam = homeTeamSnap.data();
  const awayTeam = awayTeamSnap.data();

  if (!homeTeam || !awayTeam) {
    throw new Error(`Missing team docs for matchup ${matchupDoc.id}`);
  }

  const homeSnapshot = buildSnapshot(homeTeam.lineup, date, true);
  const awaySnapshot = buildSnapshot(awayTeam.lineup, date, false);

  await matchupDoc.ref.set(
    {
      homeLineupSnapshots: {
        ...(matchup.homeLineupSnapshots ?? {}),
        [date]: homeSnapshot,
      },
      awayLineupSnapshots: {
        ...(matchup.awayLineupSnapshots ?? {}),
        [date]: awaySnapshot,
      },
      homeScore: sumFantasyPoints(homeSnapshot),
      awayScore: sumFantasyPoints(awaySnapshot),
      updatedAt: new Date(),
    },
    { merge: true },
  );

  console.log(`Simulated matchup ${matchupDoc.id} for ${date}`);
}

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const date = parseDate(process.env.SIM_DATE);
  const matchupId = process.env.MATCHUP_ID;

  if (matchupId) {
    const doc = await db.collection("matchups").doc(matchupId).get();
    if (!doc.exists) {
      throw new Error(`Matchup "${matchupId}" not found.`);
    }

    const matchup = doc.data() as Matchup;
    if (matchup.status !== "active") {
      console.warn(
        `Matchup "${matchupId}" is already ${matchup.status}. Skipping simulation.`,
      );
      return;
    }

    await updateMatchup(db, doc as QueryDocumentSnapshot<DocumentData>, date);
    return;
  }

  const matchups = await db
    .collection("matchups")
    .where("status", "==", "active")
    .get();

  for (const doc of matchups.docs) {
    await updateMatchup(db, doc, date);
  }
};
