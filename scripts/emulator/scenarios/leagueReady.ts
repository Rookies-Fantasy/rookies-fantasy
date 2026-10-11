import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { TEAM_BALANCE } from "../../../client/types/team.js";
import { DEFAULT_AUGMENTS } from "../data/augments.js";
import { DEFAULT_NBA_PLAYERS } from "../data/nbaPlayers.js";
import { DEFAULT_NBA_TEAMS } from "../data/nbaTeams.js";
import { stageAugments } from "../fixtures/augments.js";
import { type LeagueMember, stageLeague } from "../fixtures/leagues.js";
import { stageNbaPlayers } from "../fixtures/nbaPlayers.js";
import { stageNbaTeams } from "../fixtures/nbaTeams.js";
import { stageTeam } from "../fixtures/teams.js";
import { ensureAuthUser, stageUser } from "../fixtures/users.js";
import { buildLineup, getLineupSalary } from "../generate/lineup.js";

export const FULL_LEAGUE_ID = "emulator-league-full";
export const OPEN_LEAGUE_ID = "emulator-league-open";

export type LeagueReadyScenarioOptions = {
  userEmail: string;
  opponentEmail: string;
  memberEmails: [string, string];
  password: string;
  userTeamId: string;
};

export type LeagueReadyScenarioResult = {
  userId: string;
  opponentId: string;
  memberIds: [string, string];
  fullLeagueId: string;
  openLeagueId: string;
};

type LeagueUser = {
  id: string;
  username: string;
  abbreviation: string;
  logoIndex: number;
};

export const createLeagueReadyScenario = async (
  db: Firestore,
  auth: Auth,
  options: LeagueReadyScenarioOptions,
): Promise<LeagueReadyScenarioResult> => {
  const playerPool = [...DEFAULT_NBA_PLAYERS].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const seedAugment = DEFAULT_AUGMENTS[0];
  const emails = [
    options.userEmail,
    options.opponentEmail,
    ...options.memberEmails,
  ];
  const [user, opponent, memberOne, memberTwo] = await Promise.all(
    emails.map((email) =>
      ensureAuthUser(auth, { email, password: options.password }),
    ),
  );
  const leagueUsers: LeagueUser[] = [
    {
      id: user.uid,
      username: "League User",
      abbreviation: "LGU",
      logoIndex: 1,
    },
    {
      id: opponent.uid,
      username: "League Opponent",
      abbreviation: "LGO",
      logoIndex: 2,
    },
    {
      id: memberOne.uid,
      username: "League Member 1",
      abbreviation: "LM1",
      logoIndex: 3,
    },
    {
      id: memberTwo.uid,
      username: "League Member 2",
      abbreviation: "LM2",
      logoIndex: 4,
    },
  ];
  const [dev, opp, one, two] = leagueUsers;

  const batch = db.batch();
  stageNbaPlayers(db, batch, DEFAULT_NBA_PLAYERS);
  stageNbaTeams(db, batch, DEFAULT_NBA_TEAMS);
  stageAugments(db, batch, DEFAULT_AUGMENTS);

  leagueUsers.forEach((leagueUser, index) => {
    stageUser(db, batch, emails[index], {
      id: leagueUser.id,
      emailVerified: true,
      avatarUrl: `../assets/images/profile/${leagueUser.logoIndex}.png`,
      dateOfBirth: new Date("1990-01-01"),
      username: leagueUser.username,
      queueStatus: "idle",
      ...(leagueUser.id === dev.id ? { teamId: options.userTeamId } : {}),
    });
  });

  const rankedLineup = buildLineup(playerPool);
  stageTeam(db, batch, {
    userId: dev.id,
    teamId: options.userTeamId,
    document: {
      name: "Ranked Team",
      abbreviation: "RNK",
      logoUrl: "../assets/images/team/1.png",
      augment: seedAugment,
      augmentId: seedAugment.id,
      balance: TEAM_BALANCE - getLineupSalary(rankedLineup),
      lineup: rankedLineup,
    },
  });

  let lineupOffset = 1;
  const toMember = (leagueUser: LeagueUser, teamId: string): LeagueMember => {
    const lineup = buildLineup(playerPool, lineupOffset % playerPool.length);
    lineupOffset += 1;

    return {
      userId: leagueUser.id,
      teamId,
      team: {
        name: `${leagueUser.username} League Team`,
        abbreviation: leagueUser.abbreviation,
        logoUrl: `../assets/images/team/${leagueUser.logoIndex}.png`,
        augment: seedAugment,
        augmentId: seedAugment.id,
        balance: TEAM_BALANCE - getLineupSalary(lineup),
        lineup,
      },
    };
  };

  stageLeague(db, batch, {
    leagueId: FULL_LEAGUE_ID,
    creatorUserId: dev.id,
    members: [
      toMember(dev, `${FULL_LEAGUE_ID}-user`),
      toMember(opp, `${FULL_LEAGUE_ID}-opponent`),
      toMember(one, `${FULL_LEAGUE_ID}-member-1`),
      toMember(two, `${FULL_LEAGUE_ID}-member-2`),
    ],
    document: { name: "Full League", numberOfTeams: 4 },
  });
  stageLeague(db, batch, {
    leagueId: OPEN_LEAGUE_ID,
    creatorUserId: opp.id,
    members: [
      toMember(opp, `${OPEN_LEAGUE_ID}-opponent`),
      toMember(one, `${OPEN_LEAGUE_ID}-member-1`),
    ],
    document: { name: "Open League", numberOfTeams: 6 },
  });
  await batch.commit();

  return {
    userId: dev.id,
    opponentId: opp.id,
    memberIds: [one.id, two.id],
    fullLeagueId: FULL_LEAGUE_ID,
    openLeagueId: OPEN_LEAGUE_ID,
  };
};
