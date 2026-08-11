import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createMatchupDoc } from "../generate/matchup.js";
import { createTeamDoc } from "../generate/team.js";
import { createUserDoc } from "../generate/user.js";
import { PLAYERS } from "./injectNbaPlayers.js";

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

type SeedPlayer = (typeof PLAYERS)[number];

const buildLineup = (players: SeedPlayer[]) =>
  lineupPositions.map((position, index) => ({
    position,
    player: players[index]
      ? {
          id: players[index].playerId,
          firstName: players[index].firstName,
          lastName: players[index].lastName,
          positions: players[index].positions,
          salary: players[index].salary,
          headshotUrl: players[index].headshotUrl,
          teamAbbreviation: players[index].teamAbbreviation,
        }
      : null,
  }));

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const password = process.env.USER_PASSWORD ?? "password123";
  const playerPool = [...PLAYERS].sort((a, b) =>
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
  });
  const awayUser = createUserDoc(awayEmail, {
    id: away.uid,
    emailVerified: true,
  });
  await Promise.all([
    db.collection("users").doc(home.uid).set(homeUser),
    db.collection("users").doc(away.uid).set(awayUser),
  ]);

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
  const homeTeam = createTeamDoc({
    id: homeTeamRef.id,
    name: "Home Team",
    abbreviation: "HME",
    lineup: buildLineup(homePlayers),
  });
  const awayTeam = createTeamDoc({
    id: awayTeamRef.id,
    name: "Away Team",
    abbreviation: "AWY",
    lineup: buildLineup(awayPlayers),
  });
  await Promise.all([homeTeamRef.set(homeTeam), awayTeamRef.set(awayTeam)]);

  const matchupRef = db.collection("matchups").doc();
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
      updatedAt: new Date(),
    },
  );
  await db.collection("matchups").doc(matchupId).set(matchup);

  await Promise.all([
    db.collection("users").doc(home.uid).update({
      queueStatus: "matched",
      currentMatchupId: matchup.id,
      teamId: homeTeamId,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(away.uid).update({
      queueStatus: "matched",
      currentMatchupId: matchup.id,
      teamId: awayTeamId,
      updatedAt: new Date(),
    }),
  ]);

  console.log("Created scenario");
  console.log(`  Home UID: ${home.uid}`);
  console.log(`  Away UID: ${away.uid}`);
  console.log(`  Matchup ID: ${matchup.id}`);
  console.log(`  Players seeded: ${homePlayers.length}`);
};
