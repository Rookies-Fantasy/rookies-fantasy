// Seeds an active ranked matchup for the current week between an App Review
// demo account and a house opponent, so a single reviewer account can see a
// live matchup in Arena.
//
// Targets the local emulator unless --live and --project are both passed.
// Safe to re-run: the matchup ID is derived from the demo user and the week.
//
// Usage (from scripts/):
//   npm run seed:review-matchup -- --demo-email dev@test.com
//   npm run seed:review-matchup -- --demo-email <email> --live --project <id>
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";
import { parseArgs } from "node:util";
import { TEAM_BALANCE } from "../../client/types/team.js";
import type {
  PlayerTeamDisplay,
  SlotPosition,
  TeamLineupSlot,
} from "../../client/types/team.js";
import { getCurrentWeekStart } from "../../server/functions/src/utils/dates.js";
import { PROJECT_ID as EMULATOR_PROJECT_ID } from "../emulator/core/client.js";

const OPPONENT_USER_ID = "app-review-opponent";
const OPPONENT_TEAM_ID = "app-review-opponent-team";
const PLAYER_POOL_SIZE = 120;
const LINEUP_POSITIONS: readonly SlotPosition[] = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "UTIL1",
  "UTIL2",
  "UTIL3",
];

type Options = {
  demoEmail: string;
  live: boolean;
  projectId: string;
};

const parseOptions = (): Options => {
  const { values } = parseArgs({
    options: {
      "demo-email": { type: "string" },
      live: { type: "boolean", default: false },
      project: { type: "string" },
    },
  });

  const demoEmail = values["demo-email"] ?? process.env.DEMO_USER_EMAIL;
  if (!demoEmail) {
    throw new Error(
      "Pass --demo-email <email> (or DEMO_USER_EMAIL) for the review account.",
    );
  }

  if (values.live) {
    if (!values.project) {
      throw new Error("--live requires an explicit --project <project-id>.");
    }
    return { demoEmail, live: true, projectId: values.project };
  }

  if (values.project && values.project !== EMULATOR_PROJECT_ID) {
    throw new Error(
      `--project ${values.project} targets a real project. Add --live to confirm.`,
    );
  }
  return { demoEmail, live: false, projectId: EMULATOR_PROJECT_ID };
};

const initFirebase = ({ live, projectId }: Options) => {
  if (live) {
    // Never inherit emulator hosts when writing to a real project, or the
    // reverse.
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  } else {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
  }

  if (getApps().length === 0) {
    initializeApp(
      live ? { credential: applicationDefault(), projectId } : { projectId },
    );
  }
  return { db: getFirestore(), auth: getAuth() };
};

const toTeamPlayer = (doc: DocumentData): PlayerTeamDisplay | null => {
  const id = String(doc.playerId ?? "");
  const positions = Array.isArray(doc.positions)
    ? (doc.positions as SlotPosition[])
    : [];
  if (!id || positions.length === 0 || typeof doc.salary !== "number") {
    return null;
  }
  return {
    id,
    firstName: String(doc.firstName ?? ""),
    lastName: String(doc.lastName ?? ""),
    positions,
    salary: doc.salary,
    headshotUrl: String(doc.headshotUrl ?? ""),
    teamAbbreviation: String(doc.teamAbbreviation ?? ""),
  };
};

// Depth-first fill of the eight slots from a salary-sorted pool, staying
// within the team budget.
const fillLineup = (
  candidates: readonly PlayerTeamDisplay[],
): TeamLineupSlot[] | null => {
  const lineup: TeamLineupSlot[] = [];
  const selected = new Set<string>();

  const fill = (slotIndex: number, salary: number): boolean => {
    if (slotIndex === LINEUP_POSITIONS.length) return true;
    const position = LINEUP_POSITIONS[slotIndex];
    for (const player of candidates) {
      if (
        selected.has(player.id) ||
        salary + player.salary > TEAM_BALANCE ||
        (!position.startsWith("UTIL") && !player.positions.includes(position))
      ) {
        continue;
      }
      selected.add(player.id);
      lineup.push({ position, player });
      if (fill(slotIndex + 1, salary + player.salary)) return true;
      lineup.pop();
      selected.delete(player.id);
    }
    return false;
  };

  return fill(0, 0) ? lineup : null;
};

// Prefers players the demo team doesn't have, falling back to the full pool.
const pickLineup = (
  pool: readonly PlayerTeamDisplay[],
  excludedIds: ReadonlySet<string>,
): TeamLineupSlot[] => {
  const lineup =
    fillLineup(pool.filter((player) => !excludedIds.has(player.id))) ??
    fillLineup(pool);
  if (!lineup) {
    throw new Error("Could not build an opponent lineup from nbaPlayers.");
  }
  return lineup;
};

const isCompleteLineup = (
  lineup: readonly TeamLineupSlot[] | null | undefined,
): boolean =>
  Array.isArray(lineup) &&
  lineup.length === LINEUP_POSITIONS.length &&
  lineup.every((slot) => slot.player !== null);

const getAugmentSnapshot = async (
  db: Firestore,
  augmentId: string | null | undefined,
): Promise<DocumentData | null> => {
  if (!augmentId) return null;
  const augment = await db.collection("augments").doc(augmentId).get();
  return augment.exists ? { id: augment.id, ...augment.data() } : null;
};

const createTeamSnapshot = (
  team: DocumentData,
  augmentSnapshot: DocumentData | null,
) => ({
  name: team.name ?? "Team",
  logoUrl: team.logoUrl ?? "",
  record: team.record ?? { wins: 0, losses: 0, draws: 0 },
  lineup: team.lineup,
  ...(augmentSnapshot ? { augmentSnapshot } : {}),
});

const main = async () => {
  const options = parseOptions();
  const { db, auth } = initFirebase(options);
  const target = options.live
    ? `LIVE project "${options.projectId}"`
    : `emulator (${options.projectId})`;
  console.log(`Seeding the App Review matchup on ${target}.`);

  const demoAuthUser = await auth.getUserByEmail(options.demoEmail);
  const demoUserId = demoAuthUser.uid;
  const demoUserRef = db.collection("users").doc(demoUserId);
  const demoUser = (await demoUserRef.get()).data();
  if (!demoUser) {
    throw new Error(`No user document for ${options.demoEmail}.`);
  }

  // The ranked team: the selected team if set, else the first non-league team.
  const teams = await demoUserRef.collection("teams").get();
  const demoTeamDoc =
    teams.docs.find((doc) => doc.id === demoUser.teamId) ??
    teams.docs.find((doc) => doc.data().isLeagueTeam !== true);
  const demoTeam = demoTeamDoc?.data();
  if (!demoTeamDoc || !demoTeam || !isCompleteLineup(demoTeam.lineup)) {
    throw new Error(
      `${options.demoEmail} needs a ranked team with a full lineup. Build one in the app first.`,
    );
  }

  const weekStart = getCurrentWeekStart(new Date());
  const matchupId = `app-review-${demoUserId}-${weekStart}`;
  const matchupRef = db.collection("matchups").doc(matchupId);

  // Don't overwrite a real matchup the demo user is already playing.
  const currentMatchupId = demoUser.currentMatchupId;
  if (
    typeof currentMatchupId === "string" &&
    currentMatchupId &&
    currentMatchupId !== matchupId &&
    !currentMatchupId.startsWith("app-review-")
  ) {
    const current = await db.collection("matchups").doc(currentMatchupId).get();
    if (current.data()?.status === "active") {
      throw new Error(
        `${options.demoEmail} is already in active matchup ${currentMatchupId}. Not replacing it.`,
      );
    }
  }

  // Reuse the house opponent's team so its lineup stays stable across weeks.
  const opponentUserRef = db.collection("users").doc(OPPONENT_USER_ID);
  const opponentTeamRef = opponentUserRef
    .collection("teams")
    .doc(OPPONENT_TEAM_ID);
  const existingOpponentTeam = (await opponentTeamRef.get()).data();
  let opponentLineup: TeamLineupSlot[];
  if (existingOpponentTeam && isCompleteLineup(existingOpponentTeam.lineup)) {
    opponentLineup = existingOpponentTeam.lineup;
  } else {
    const players = await db
      .collection("nbaPlayers")
      .orderBy("salary", "desc")
      .limit(PLAYER_POOL_SIZE)
      .get();
    const pool = players.docs
      .map((doc) => toTeamPlayer(doc.data()))
      .filter((player): player is PlayerTeamDisplay => player !== null);
    const demoPlayerIds = new Set<string>(
      demoTeam.lineup.map((slot: TeamLineupSlot) => slot.player?.id ?? ""),
    );
    opponentLineup = pickLineup(pool, demoPlayerIds);
  }

  const now = new Date();
  const opponentTeam = {
    id: OPPONENT_TEAM_ID,
    name: existingOpponentTeam?.name ?? "Rookies House Team",
    abbreviation: existingOpponentTeam?.abbreviation ?? "RKS",
    logoUrl: existingOpponentTeam?.logoUrl ?? "../assets/images/team/3.png",
    balance:
      TEAM_BALANCE -
      opponentLineup.reduce(
        (total, slot) => total + (slot.player?.salary ?? 0),
        0,
      ),
    lineup: opponentLineup,
    bench: existingOpponentTeam?.bench ?? [],
    record: existingOpponentTeam?.record ?? { wins: 0, losses: 0, draws: 0 },
    hasUserChanges: false,
    isLeagueTeam: false,
    matchupId,
    createdAt: existingOpponentTeam?.createdAt ?? now,
    updatedAt: now,
  };

  const existingMatchup = (await matchupRef.get()).data();
  const demoAugment = await getAugmentSnapshot(db, demoTeam.augmentId);

  const batch = db.batch();
  batch.set(
    opponentUserRef,
    {
      id: OPPONENT_USER_ID,
      username: "Rookies House",
      emailVerified: true,
      avatarUrl: "../assets/images/profile/2.png",
      queueStatus: "matched",
      teamId: OPPONENT_TEAM_ID,
      currentMatchupId: matchupId,
      queuedAt: FieldValue.delete(),
      updatedAt: now,
    },
    { merge: true },
  );
  batch.set(opponentTeamRef, opponentTeam);

  if (existingMatchup?.status === "completed") {
    console.log(`Matchup ${matchupId} is already completed. Leaving it.`);
  } else if (existingMatchup) {
    console.log(`Matchup ${matchupId} already exists. Keeping its scores.`);
  } else {
    batch.set(matchupRef, {
      id: matchupId,
      createdAt: now,
      weekStart,
      // Ranked matchups have no league.
      leagueId: null,
      homeUserId: demoUserId,
      homeTeamId: demoTeamDoc.id,
      awayUserId: OPPONENT_USER_ID,
      awayTeamId: OPPONENT_TEAM_ID,
      homeTeamSnapshot: createTeamSnapshot(demoTeam, demoAugment),
      awayTeamSnapshot: createTeamSnapshot(opponentTeam, null),
      homeLineupSnapshots: {},
      awayLineupSnapshots: {},
      status: "active",
    });
  }

  if (existingMatchup?.status !== "completed") {
    batch.update(demoUserRef, {
      queueStatus: "matched",
      currentMatchupId: matchupId,
      queuedAt: FieldValue.delete(),
      updatedAt: now,
    });
    batch.update(demoTeamDoc.ref, { matchupId, updatedAt: now });
  }

  await batch.commit();

  console.log("Seeded App Review matchup");
  console.log(`  Demo user: ${options.demoEmail} (${demoUserId})`);
  console.log(`  Demo team: ${demoTeamDoc.id}`);
  console.log(`  Opponent: ${OPPONENT_USER_ID} / ${OPPONENT_TEAM_ID}`);
  console.log(`  Matchup ID: ${matchupId}`);
  console.log(`  Week start: ${weekStart}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
