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
  const password = process.env.USER_PASSWORD ?? "Test1234!";
  const playerPool = [...PLAYERS].sort((a, b) =>
    a.playerId.localeCompare(b.playerId),
  );
  const homePlayers = playerPool.slice(0, 8);
  const awayPlayers = playerPool.slice(0, 8).reverse();

  const home = await auth.createUser({
    email: "home@r.test",
    password,
    emailVerified: true,
  });
  const away = await auth.createUser({
    email: "away@r.test",
    password,
    emailVerified: true,
  });

  const homeUser = createUserDoc("home@r.test", {
    id: home.uid,
    emailVerified: true,
  });
  const awayUser = createUserDoc("away@r.test", {
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
    .doc();
  const awayTeamRef = db
    .collection("users")
    .doc(away.uid)
    .collection("teams")
    .doc();
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
    { id: matchupRef.id },
  );
  await matchupRef.set(matchup);

  await Promise.all([
    db.collection("users").doc(home.uid).update({
      queueStatus: "matched",
      currentMatchupId: matchup.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(away.uid).update({
      queueStatus: "matched",
      currentMatchupId: matchup.id,
      updatedAt: new Date(),
    }),
  ]);

  console.log("Created scenario");
  console.log(`  Home UID: ${home.uid}`);
  console.log(`  Away UID: ${away.uid}`);
  console.log(`  Matchup ID: ${matchup.id}`);
  console.log(`  Players seeded: ${homePlayers.length}`);
};
