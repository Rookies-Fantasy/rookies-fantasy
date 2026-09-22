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

export type DraftReadyScenarioOptions = {
  email: string;
  password: string;
  teamId: string;
};

export type DraftReadyScenarioResult = {
  userId: string;
  teamId: string;
  playersSeeded: number;
};

export const createDraftReadyScenario = async (
  db: Firestore,
  auth: Auth,
  options: DraftReadyScenarioOptions,
): Promise<DraftReadyScenarioResult> => {
  const user = await ensureAuthUser(auth, {
    email: options.email,
    password: options.password,
  });

  const batch = db.batch();
  stageNbaPlayers(db, batch, DEFAULT_NBA_PLAYERS);
  stageNbaTeams(db, batch, DEFAULT_NBA_TEAMS);
  stageAugments(db, batch, DEFAULT_AUGMENTS);
  stageUser(db, batch, options.email, {
    id: user.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/1.png",
    dateOfBirth: new Date("1990-01-01"),
    username: "Draft User",
    queueStatus: "idle",
    teamId: options.teamId,
  });
  stageTeam(db, batch, {
    userId: user.uid,
    teamId: options.teamId,
    document: {
      name: "Draft Team",
      abbreviation: "DRF",
      logoUrl: "../assets/images/team/2.png",
      balance: TEAM_BALANCE,
    },
  });
  await batch.commit();

  return {
    userId: user.uid,
    teamId: options.teamId,
    playersSeeded: DEFAULT_NBA_PLAYERS.length,
  };
};
