import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { TEAM_BALANCE } from "../../../client/types/team.js";
import { DEFAULT_AUGMENTS } from "../data/augments.js";
import { DEFAULT_NBA_PLAYERS } from "../data/nbaPlayers.js";
import { stageAugments } from "../fixtures/augments.js";
import {
  resolveSeedMatchupId,
  stageActiveMatchup,
} from "../fixtures/matchups.js";
import { stageNbaPlayers } from "../fixtures/nbaPlayers.js";
import { resolveSeedTeamId, stageTeam } from "../fixtures/teams.js";
import { ensureAuthUser, stageUser } from "../fixtures/users.js";
import { buildLineup, getLineupSalary } from "../generate/lineup.js";
import type { RankedMatchupDoc } from "../types/firestore.js";

export type MatchupScenarioOptions = {
  homeEmail: string;
  awayEmail: string;
  password: string;
  homeTeamId?: string;
  awayTeamId?: string;
  matchupId?: string;
};

export type MatchupScenarioResult = {
  homeUserId: string;
  awayUserId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchupId: string;
  playersSeeded: number;
};

export const createMatchupScenario = async (
  db: Firestore,
  auth: Auth,
  options: MatchupScenarioOptions,
): Promise<MatchupScenarioResult> => {
  const playerPool = [...DEFAULT_NBA_PLAYERS].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const homePlayers = playerPool.slice(0, 8);
  const awayPlayers = playerPool.slice(-8).reverse();
  const seedAugment = DEFAULT_AUGMENTS[0];
  const homeLineup = buildLineup(homePlayers);
  const awayLineup = buildLineup(awayPlayers, 1);

  const home = await ensureAuthUser(auth, {
    email: options.homeEmail,
    password: options.password,
  });
  const away = await ensureAuthUser(auth, {
    email: options.awayEmail,
    password: options.password,
  });
  const [homeTeamId, awayTeamId] = await Promise.all([
    resolveSeedTeamId(db, home.uid, options.homeTeamId),
    resolveSeedTeamId(db, away.uid, options.awayTeamId),
  ]);
  const matchupId = await resolveSeedMatchupId(db, {
    matchupId: options.matchupId,
    homeUserId: home.uid,
    awayUserId: away.uid,
    homeTeamId,
    awayTeamId,
  });
  const existingMatchup = await db.collection("matchups").doc(matchupId).get();

  const batch = db.batch();
  stageNbaPlayers(db, batch, DEFAULT_NBA_PLAYERS);
  stageAugments(db, batch, DEFAULT_AUGMENTS);

  stageUser(db, batch, options.homeEmail, {
    id: home.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/1.png",
    dateOfBirth: new Date("1990-01-01"),
    username: "Dev User",
    queueStatus: "matched",
    teamId: homeTeamId,
    currentMatchupId: matchupId,
  });
  stageUser(db, batch, options.awayEmail, {
    id: away.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/2.png",
    dateOfBirth: new Date("1991-01-01"),
    username: "Opponent User",
    queueStatus: "matched",
    teamId: awayTeamId,
    currentMatchupId: matchupId,
  });

  const homeTeam = stageTeam(db, batch, {
    userId: home.uid,
    teamId: homeTeamId,
    document: {
      name: "Home Team",
      abbreviation: "HME",
      logoUrl: "../assets/images/team/2.png",
      augment: seedAugment,
      augmentId: seedAugment.id,
      balance: TEAM_BALANCE - getLineupSalary(homeLineup),
      lineup: homeLineup,
      matchupId,
    },
  });
  const awayTeam = stageTeam(db, batch, {
    userId: away.uid,
    teamId: awayTeamId,
    document: {
      name: "Away Team",
      abbreviation: "AWY",
      logoUrl: "../assets/images/team/3.png",
      augment: seedAugment,
      augmentId: seedAugment.id,
      balance: TEAM_BALANCE - getLineupSalary(awayLineup),
      lineup: awayLineup,
      matchupId,
    },
  });

  const matchup = stageActiveMatchup(db, batch, {
    matchupId,
    homeUserId: home.uid,
    homeTeamId,
    homeTeam,
    awayUserId: away.uid,
    awayTeamId,
    awayTeam,
    document: existingMatchup.exists
      ? (existingMatchup.data() as Partial<RankedMatchupDoc>)
      : {},
  });
  await batch.commit();

  return {
    homeUserId: home.uid,
    awayUserId: away.uid,
    homeTeamId,
    awayTeamId,
    matchupId: matchup.id,
    playersSeeded: homePlayers.length,
  };
};
