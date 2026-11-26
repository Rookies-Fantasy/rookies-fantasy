import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { TEAM_BALANCE } from "../../../client/types/team.js";
import { DEFAULT_AUGMENTS } from "../data/augments.js";
import { DEFAULT_NBA_PLAYERS } from "../data/nbaPlayers.js";
import { stageAugments } from "../fixtures/augments.js";
import { type LeagueMember, stageLeague } from "../fixtures/leagues.js";
import { stageNbaPlayers } from "../fixtures/nbaPlayers.js";
import { stageSeasonConfig } from "../fixtures/season.js";
import { stageTeam } from "../fixtures/teams.js";
import { ensureAuthUser, stageUser } from "../fixtures/users.js";
import { pacificDateFromToday } from "../generate/league.js";
import { buildLineup, getLineupSalary } from "../generate/lineup.js";

// Forming leagues for the daily `generateLeagueSchedules` job. Three have a
// deadline that closed yesterday, so the next run picks them up; one is still
// open today and must be left alone.
export const SCHEDULE_LEAGUES = {
  short: { id: "emulator-schedule-short", members: 3, numberOfTeams: 4 },
  odd: { id: "emulator-schedule-odd", members: 5, numberOfTeams: 6 },
  even: { id: "emulator-schedule-even", members: 8, numberOfTeams: 10 },
  open: { id: "emulator-schedule-open", members: 4, numberOfTeams: 4 },
} as const;

export const SCHEDULE_MEMBER_COUNT = 8;

export type ScheduleReadyScenarioOptions = {
  memberEmails: string[];
  password: string;
};

export type ScheduleReadyScenarioResult = {
  memberIds: string[];
};

export const createScheduleReadyScenario = async (
  db: Firestore,
  auth: Auth,
  options: ScheduleReadyScenarioOptions,
): Promise<ScheduleReadyScenarioResult> => {
  const playerPool = [...DEFAULT_NBA_PLAYERS].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const users = await Promise.all(
    options.memberEmails.map((email) =>
      ensureAuthUser(auth, { email, password: options.password }),
    ),
  );

  const seedAugment = DEFAULT_AUGMENTS[0];
  const batch = db.batch();
  stageNbaPlayers(db, batch, DEFAULT_NBA_PLAYERS);
  stageAugments(db, batch, DEFAULT_AUGMENTS);
  stageSeasonConfig(db, batch);

  let lineupOffset = 0;

  users.forEach((user, index) => {
    const mainTeamId = `sch${index + 1}-main`;
    const lineup = buildLineup(playerPool, lineupOffset % playerPool.length);
    lineupOffset += 1;

    stageUser(db, batch, options.memberEmails[index], {
      id: user.uid,
      emailVerified: true,
      avatarUrl: `../assets/images/profile/${(index % 6) + 1}.png`,
      dateOfBirth: new Date("1990-01-01"),
      username: `Schedule Member ${index + 1}`,
      queueStatus: "idle",
      teamId: mainTeamId,
    });
    stageTeam(db, batch, {
      userId: user.uid,
      teamId: mainTeamId,
      document: {
        name: `Sch ${index + 1} Ranked`,
        abbreviation: `SR${index + 1}`.slice(0, 3),
        logoUrl: `../assets/images/team/${(index % 6) + 1}.png`,
        augment: seedAugment,
        augmentId: seedAugment.id,
        balance: TEAM_BALANCE - getLineupSalary(lineup),
        lineup,
      },
    });
  });

  const toMember = (leagueId: string, index: number): LeagueMember => {
    const lineup = buildLineup(playerPool, lineupOffset % playerPool.length);
    lineupOffset += 1;

    return {
      userId: users[index].uid,
      teamId: `${leagueId}-member-${index + 1}`,
      team: {
        name: `Schedule Team ${index + 1}`,
        abbreviation: `S${index + 1}`.padEnd(3, "X"),
        logoUrl: `../assets/images/team/${(index % 6) + 1}.png`,
        balance: TEAM_BALANCE - getLineupSalary(lineup),
        lineup,
        record: { wins: 0, losses: 0, draws: 0 },
      },
    };
  };

  for (const [key, league] of Object.entries(SCHEDULE_LEAGUES)) {
    const members = Array.from({ length: league.members }, (_, index) =>
      toMember(league.id, index),
    );
    stageLeague(db, batch, {
      leagueId: league.id,
      creatorUserId: members[0].userId,
      members,
      document: {
        name: `Schedule ${key} league`,
        numberOfTeams: league.numberOfTeams,
        deadline: pacificDateFromToday(key === "open" ? 0 : -1),
        status: "forming",
      },
    });
  }

  await batch.commit();
  return { memberIds: users.map((user) => user.uid) };
};
