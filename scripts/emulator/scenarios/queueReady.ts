import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { TEAM_BALANCE } from "../../../client/types/team.js";
import { DEFAULT_AUGMENTS } from "../data/augments.js";
import { DEFAULT_NBA_PLAYERS } from "../data/nbaPlayers.js";
import { DEFAULT_NBA_TEAMS } from "../data/nbaTeams.js";
import { stageAugments } from "../fixtures/augments.js";
import { stageNbaPlayers } from "../fixtures/nbaPlayers.js";
import { stageNbaTeams } from "../fixtures/nbaTeams.js";
import { stageTeam } from "../fixtures/teams.js";
import { ensureAuthUser, stageUser } from "../fixtures/users.js";
import { buildLineup, getLineupSalary } from "../generate/lineup.js";

export type QueueReadyScenarioOptions = {
  userEmail: string;
  opponentEmail: string;
  password: string;
  userTeamId: string;
  opponentTeamId: string;
};

export type QueueReadyScenarioResult = {
  userId: string;
  opponentId: string;
  userTeamId: string;
  opponentTeamId: string;
};

export const createQueueReadyScenario = async (
  db: Firestore,
  auth: Auth,
  options: QueueReadyScenarioOptions,
): Promise<QueueReadyScenarioResult> => {
  const playerPool = [...DEFAULT_NBA_PLAYERS].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const userLineup = buildLineup(playerPool.slice(0, 8));
  const opponentLineup = buildLineup(playerPool.slice(0, 8).reverse(), 1);
  const seedAugment = DEFAULT_AUGMENTS[0];
  const [user, opponent] = await Promise.all([
    ensureAuthUser(auth, {
      email: options.userEmail,
      password: options.password,
    }),
    ensureAuthUser(auth, {
      email: options.opponentEmail,
      password: options.password,
    }),
  ]);

  const batch = db.batch();
  stageNbaPlayers(db, batch, DEFAULT_NBA_PLAYERS);
  stageNbaTeams(db, batch, DEFAULT_NBA_TEAMS);
  stageAugments(db, batch, DEFAULT_AUGMENTS);

  stageUser(db, batch, options.userEmail, {
    id: user.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/1.png",
    dateOfBirth: new Date("1990-01-01"),
    username: "Queue User",
    queueStatus: "idle",
    teamId: options.userTeamId,
  });
  stageUser(db, batch, options.opponentEmail, {
    id: opponent.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/2.png",
    dateOfBirth: new Date("1991-01-01"),
    username: "Queue Opponent",
    queueStatus: "idle",
    teamId: options.opponentTeamId,
  });

  stageTeam(db, batch, {
    userId: user.uid,
    teamId: options.userTeamId,
    document: {
      name: "Queue Team",
      abbreviation: "QUE",
      logoUrl: "../assets/images/team/2.png",
      augment: seedAugment,
      augmentId: seedAugment.id,
      balance: TEAM_BALANCE - getLineupSalary(userLineup),
      lineup: userLineup,
    },
  });
  stageTeam(db, batch, {
    userId: opponent.uid,
    teamId: options.opponentTeamId,
    document: {
      name: "Opponent Team",
      abbreviation: "OPP",
      logoUrl: "../assets/images/team/3.png",
      augment: seedAugment,
      augmentId: seedAugment.id,
      balance: TEAM_BALANCE - getLineupSalary(opponentLineup),
      lineup: opponentLineup,
    },
  });
  await batch.commit();

  return {
    userId: user.uid,
    opponentId: opponent.uid,
    userTeamId: options.userTeamId,
    opponentTeamId: options.opponentTeamId,
  };
};
