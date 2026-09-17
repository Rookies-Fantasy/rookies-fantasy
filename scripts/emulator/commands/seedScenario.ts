import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { TEAM_BALANCE } from "../../../client/types/team.js";
import { DEFAULT_AUGMENTS } from "../data/augments.js";
import { DEFAULT_NBA_PLAYERS } from "../data/nbaPlayers.js";
import { createMatchupDoc } from "../generate/matchup.js";
import { createTeamDoc } from "../generate/team.js";
import { createUserDoc } from "../generate/user.js";

const lineupPositions = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "UTIL1",
  "UTIL2",
  "UTIL3",
] as const;

type SeedPlayer = (typeof DEFAULT_NBA_PLAYERS)[number];

const seedAugment = DEFAULT_AUGMENTS[0];

const toTeamPlayer = (player: SeedPlayer) => ({
  id: player.playerId,
  firstName: player.firstName,
  lastName: player.lastName,
  positions: player.positions,
  salary: player.salary,
  headshotUrl: player.headshotUrl,
  teamAbbreviation: player.teamAbbreviation,
});

const buildLineup = (players: SeedPlayer[], offset = 0) => {
  const rotatedPlayers = [
    ...players.slice(offset),
    ...players.slice(0, offset),
  ];
  const selected = new Set<string>();

  return lineupPositions.map((position) => {
    const player = rotatedPlayers.find(
      (candidate) =>
        !selected.has(candidate.playerId) &&
        (position.startsWith("UTIL") || candidate.positions.includes(position)),
    );

    if (!player) {
      throw new Error(`Unable to seed a player for the ${position} position.`);
    }

    selected.add(player.playerId);
    return { position, player: toTeamPlayer(player) };
  });
};

const getLineupSalary = (lineup: ReturnType<typeof buildLineup>) =>
  lineup.reduce((total, slot) => total + (slot.player?.salary ?? 0), 0);

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const password = process.env.USER_PASSWORD ?? "password123";
  const playerPool = [...DEFAULT_NBA_PLAYERS].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const homePlayers = playerPool.slice(0, 8);
  const awayPlayers = playerPool.slice(0, 8).reverse();
  const homeEmail = process.env.HOME_USER_EMAIL ?? "dev@test.com";
  const awayEmail = process.env.AWAY_USER_EMAIL ?? "opponent@test.com";
  const homeTeamId = process.env.HOME_TEAM_ID ?? "default-team";
  const awayTeamId = process.env.AWAY_TEAM_ID ?? "default-team";
  const matchupId = process.env.MATCHUP_ID ?? "default-matchup";

  const ensureAuthUser = async (email: string) => {
    try {
      const existing = await auth.getUserByEmail(email);
      await auth.updateUser(existing.uid, {
        password,
        emailVerified: true,
      });
      return existing;
    } catch {
      return auth.createUser({
        email,
        password,
        emailVerified: true,
      });
    }
  };

  const home = await ensureAuthUser(homeEmail);
  const away = await ensureAuthUser(awayEmail);

  const homeUser = createUserDoc(homeEmail, {
    id: home.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/1.png",
    dateOfBirth: new Date("1990-01-01"),
    username: "Dev User",
    queueStatus: "matched",
    teamId: homeTeamId,
  });
  const awayUser = createUserDoc(awayEmail, {
    id: away.uid,
    emailVerified: true,
    avatarUrl: "../assets/images/profile/2.png",
    dateOfBirth: new Date("1991-01-01"),
    username: "Opponent User",
    queueStatus: "matched",
    teamId: awayTeamId,
  });

  const homeTeamRef = db
    .collection("users")
    .doc(home.uid)
    .collection("teams")
    .doc(homeTeamId);
  const awayTeamRef = db
    .collection("users")
    .doc(away.uid)
    .collection("teams")
    .doc(awayTeamId);
  const homeLineup = buildLineup(homePlayers);
  const awayLineup = buildLineup(awayPlayers, 1);
  const homeTeam = createTeamDoc({
    id: homeTeamRef.id,
    name: "Home Team",
    abbreviation: "HME",
    logoUrl: "../assets/images/team/2.png",
    augment: seedAugment,
    augmentId: seedAugment.id,
    balance: TEAM_BALANCE - getLineupSalary(homeLineup),
    lineup: homeLineup,
  });
  const awayTeam = createTeamDoc({
    id: awayTeamRef.id,
    name: "Away Team",
    abbreviation: "AWY",
    logoUrl: "../assets/images/team/3.png",
    augment: seedAugment,
    augmentId: seedAugment.id,
    balance: TEAM_BALANCE - getLineupSalary(awayLineup),
    lineup: awayLineup,
  });
  const batch = db.batch();
  const now = new Date();

  for (const player of DEFAULT_NBA_PLAYERS) {
    batch.set(db.collection("nbaPlayers").doc(player.playerId), player);
  }
  batch.set(db.collection("augments").doc(seedAugment.id), {
    ...seedAugment,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(db.collection("users").doc(home.uid), homeUser);
  batch.set(db.collection("users").doc(away.uid), awayUser);
  batch.set(homeTeamRef, homeTeam);
  batch.set(awayTeamRef, awayTeam);

  const matchup = createMatchupDoc(
    home.uid,
    homeTeamRef.id,
    homeTeam,
    away.uid,
    awayTeamRef.id,
    awayTeam,
    {
      id: matchupId,
      status: "active",
    },
  );
  batch.set(db.collection("matchups").doc(matchupId), matchup);
  batch.update(db.collection("users").doc(home.uid), {
    currentMatchupId: matchup.id,
    updatedAt: now,
  });
  batch.update(db.collection("users").doc(away.uid), {
    currentMatchupId: matchup.id,
    updatedAt: now,
  });

  await batch.commit();

  console.log("Created scenario");
  console.log(`  Home UID: ${home.uid}`);
  console.log(`  Away UID: ${away.uid}`);
  console.log(`  Matchup ID: ${matchup.id}`);
  console.log(`  Players seeded: ${homePlayers.length}`);
};
