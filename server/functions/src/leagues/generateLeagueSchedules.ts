import * as admin from "firebase-admin";
import {
  DocumentReference,
  FieldPath,
  FieldValue,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import * as functions from "firebase-functions/v1";
import {
  generateLeagueSchedule,
  RandomSource,
  ScheduledPairing,
} from "./schedule";
import { hasDeadlinePassed, SeasonConfig, todayInPacific } from "./season";
import { readSeasonConfig } from "./seasonConfig";
import {
  EMPTY_PAYLOAD,
  JsonValue,
  LeagueStatus,
  MAX_TEAMS,
  RawPayload,
  TeamRecord,
} from "./types";
import {
  isPayload,
  toLeagueDocument,
  toStringOrEmpty,
  toTeamRecord,
} from "./validation";

const LEAGUE_COLLECTION = "leagues";
const USER_COLLECTION = "users";
const TEAM_SUBCOLLECTION = "teams";
const MATCHUP_COLLECTION = "matchups";
const AUGMENT_COLLECTION = "augments";

// The team as it stood when the schedule was made. The weekly activation step
// refreshes it before the matchup goes live; until then it only needs to show
// who is playing. Same fields ranked matchups write.
type TeamSnapshotDoc = {
  name: string;
  logoUrl: string;
  record: TeamRecord;
  lineup: JsonValue[];
  augmentSnapshot?: RawPayload;
};

// A regular-season matchup as written to the shared `matchups` collection.
// Matches `LeagueMatchup` in client/types/matchup.ts.
type LeagueMatchupDoc = {
  id: string;
  leagueId: string;
  week: number;
  weekStart: string;
  phase: "regular";
  status: "scheduled";
  createdAt: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  homeTeamSnapshot: TeamSnapshotDoc;
  awayTeamSnapshot: TeamSnapshotDoc;
  homeLineupSnapshots: Record<string, JsonValue[]>;
  awayLineupSnapshots: Record<string, JsonValue[]>;
};

type LeagueTeam = {
  userId: string;
  snapshot: TeamSnapshotDoc;
};

export type LeagueScheduleOutcome =
  | "scheduled"
  | "unscheduled"
  | "skipped"
  | "missing-teams";

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

// Fixed ids, so a retried run overwrites its own matchups instead of adding more.
export const leagueMatchupId = (
  leagueId: string,
  week: number,
  index: number,
): string => `${leagueId}_w${week}_${index}`;

const readAugmentSnapshot = async (
  transaction: Transaction,
  db: Firestore,
  augmentId: JsonValue,
): Promise<RawPayload | null> => {
  if (typeof augmentId !== "string" || augmentId.length === 0) {
    return null;
  }

  const augment = await transaction.get(
    db.collection(AUGMENT_COLLECTION).doc(augmentId),
  );
  return augment.exists
    ? { id: augment.id, ...(augment.data() ?? EMPTY_PAYLOAD) }
    : null;
};

const toTeamSnapshot = (
  team: RawPayload,
  augment: RawPayload | null,
): TeamSnapshotDoc => ({
  name: toStringOrEmpty(team.name),
  logoUrl: toStringOrEmpty(team.logoUrl),
  record: toTeamRecord(team.record),
  lineup: Array.isArray(team.lineup) ? team.lineup : [],
  ...(augment === null ? {} : { augmentSnapshot: augment }),
});

// Team docs live under their owner (users/{uid}/teams/{teamId}), so each member's
// subcollection is queried for the league's team ids, as getLeagueStandings does.
// The owning user is the doc's parent.
const readLeagueTeams = async (
  transaction: Transaction,
  db: Firestore,
  userIds: string[],
  teamIds: string[],
): Promise<Map<string, LeagueTeam>> => {
  const snapshots = await Promise.all(
    userIds.map((userId) =>
      transaction.get(
        db
          .collection(USER_COLLECTION)
          .doc(userId)
          .collection(TEAM_SUBCOLLECTION)
          .where(FieldPath.documentId(), "in", teamIds),
      ),
    ),
  );

  const docs = snapshots.flatMap((snapshot) => snapshot.docs);
  const augments = await Promise.all(
    docs.map((doc) =>
      readAugmentSnapshot(
        transaction,
        db,
        (doc.data() ?? EMPTY_PAYLOAD).augmentId,
      ),
    ),
  );

  const teams = new Map<string, LeagueTeam>();
  docs.forEach((doc, index) => {
    const owner = doc.ref.parent.parent;
    const data = doc.data();
    if (owner === null || !isPayload(data)) return;
    teams.set(doc.id, {
      userId: owner.id,
      snapshot: toTeamSnapshot(data, augments[index]),
    });
  });

  return teams;
};

const toMatchupDoc = (
  leagueId: string,
  pairing: ScheduledPairing,
  index: number,
  teams: Map<string, LeagueTeam>,
  createdAt: Date,
): LeagueMatchupDoc | null => {
  const home = teams.get(pairing.homeTeamId) ?? null;
  const away = teams.get(pairing.awayTeamId) ?? null;
  if (home === null || away === null) return null;

  return {
    id: leagueMatchupId(leagueId, pairing.week, index),
    leagueId,
    week: pairing.week,
    weekStart: pairing.weekStart,
    phase: "regular",
    status: "scheduled",
    createdAt,
    homeTeamId: pairing.homeTeamId,
    awayTeamId: pairing.awayTeamId,
    homeUserId: home.userId,
    awayUserId: away.userId,
    homeTeamSnapshot: home.snapshot,
    awayTeamSnapshot: away.snapshot,
    homeLineupSnapshots: {},
    awayLineupSnapshots: {},
  };
};

const markUnscheduled = (
  transaction: Transaction,
  leagueRef: DocumentReference,
): LeagueScheduleOutcome => {
  const status: LeagueStatus = "unscheduled";
  transaction.update(leagueRef, {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return "unscheduled";
};

// Turns one forming league into a season, all in one transaction: the league is
// re-read and must still be `forming` with its deadline passed, so a retry or an
// overlapping run is a no-op. Leagues below MIN_TEAMS, or whose season is now
// too short, become `unscheduled` and keep their configured size. Otherwise every
// regular-season matchup is written, the league records its playoff structure,
// and `numberOfTeams` becomes the actual team count. Playoff weeks are only
// reserved on the league; no playoff matchups are created.
export const scheduleLeague = async (
  db: Firestore,
  leagueId: string,
  season: SeasonConfig,
  today: string,
  random: RandomSource,
): Promise<LeagueScheduleOutcome> => {
  const leagueRef = db.collection(LEAGUE_COLLECTION).doc(leagueId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(leagueRef);
    const league = snapshot.exists
      ? toLeagueDocument(snapshot.data() ?? EMPTY_PAYLOAD)
      : null;

    if (
      league === null ||
      league.status !== "forming" ||
      !hasDeadlinePassed(league.deadline, today)
    ) {
      return "skipped";
    }

    const teamIds = dedupe(league.teamIds).slice(0, MAX_TEAMS);
    const result = generateLeagueSchedule({
      teamIds,
      season,
      deadline: league.deadline,
      random,
    });

    if (!result.ok) {
      console.log(`League ${leagueId} is unscheduled: ${result.reason}`);
      return markUnscheduled(transaction, leagueRef);
    }

    const teams = await readLeagueTeams(
      transaction,
      db,
      dedupe(league.userIds).slice(0, MAX_TEAMS),
      teamIds,
    );
    const missing = teamIds.filter((teamId) => !teams.has(teamId));
    if (missing.length > 0) {
      // Leave the league forming so tomorrow's run retries it.
      console.error(
        `League ${leagueId} has teams with no owner doc: ${missing.join(", ")}`,
      );
      return "missing-teams";
    }

    const { schedule } = result;
    const createdAt = new Date();
    const indexInWeek = new Map<number, number>();

    for (const pairing of schedule.pairings) {
      const index = indexInWeek.get(pairing.week) ?? 0;
      indexInWeek.set(pairing.week, index + 1);

      const matchup = toMatchupDoc(leagueId, pairing, index, teams, createdAt);
      if (matchup === null) return "missing-teams";
      transaction.set(
        db.collection(MATCHUP_COLLECTION).doc(matchup.id),
        matchup,
      );
    }

    const status: LeagueStatus = "scheduled";
    transaction.update(leagueRef, {
      status,
      numberOfTeams: teamIds.length,
      playoffTeams: schedule.playoffTeams,
      regularSeasonWeeks: schedule.regularSeasonWeeks,
      playoffStartWeek: schedule.playoffStartWeek,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return "scheduled";
  });
};

// Finds every forming league whose registration deadline has passed and
// schedules each one. One league failing doesn't stop the rest.
export const runLeagueScheduling = async (
  db: Firestore,
  now: Date,
  random: RandomSource,
): Promise<Record<LeagueScheduleOutcome | "failed", number>> => {
  const counts: Record<LeagueScheduleOutcome | "failed", number> = {
    scheduled: 0,
    unscheduled: 0,
    skipped: 0,
    "missing-teams": 0,
    failed: 0,
  };

  const season = await readSeasonConfig(db);
  if (season === null) {
    return counts;
  }

  const today = todayInPacific(now);
  const forming: LeagueStatus = "forming";
  const due = await db
    .collection(LEAGUE_COLLECTION)
    .where("status", "==", forming)
    .where("deadline", "<", today)
    .get();

  for (const doc of due.docs) {
    try {
      counts[await scheduleLeague(db, doc.id, season, today, random)] += 1;
    } catch (error) {
      counts.failed += 1;
      console.error(`Failed to schedule league ${doc.id}:`, error);
    }
  }

  console.log("League scheduling finished", counts);
  return counts;
};

// Runs daily just after midnight Pacific, when the previous day's registration
// deadlines have closed.
export const generateLeagueSchedules = functions.pubsub
  .schedule("15 0 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    await runLeagueScheduling(admin.firestore(), new Date(), Math.random);
  });
