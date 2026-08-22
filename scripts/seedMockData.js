/**
 * seedMockData.js
 *
 * Seeds the Firestore EMULATOR with a full set of mock data for local dev:
 *   - Auth accounts   (6 users, password "Test1234", UID == user doc id)
 *   - nbaTeams        (all 30, pulled live from BallDontLie)
 *   - nbaPlayers      (~28 real stars, live identity + 2024 season averages)
 *   - augments        (Block Party, Frontcourt Focus)
 *   - users           (6 users)
 *   - users/{id}/teams (a filled ranked team per user + league teams)
 *   - matchups        (1 active + 1 completed, with populated lineup snapshots)
 *   - leagues         (1 league with 4 members)
 *
 * Player identity, team, and 2024 season averages are fetched LIVE from
 * BallDontLie; positions are curated locally so lineup slots resolve to valid
 * PG/SG/SF/PF/C (the API only returns coarse G/F/C).
 *
 * Requires BOTH the Firestore AND Auth emulators running:
 *   cd server && firebase emulators:start --only firestore,auth \
 *     --project rookies-fantasy-development
 * Then:
 *   cd scripts && npm run seed-mock
 */

import "dotenv/config";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { BalldontlieAPI } from "@balldontlie/sdk";
import fetch from "node-fetch";

// ---------------------------------------------------------------------------
// Emulator-aware init (no service account needed)
// ---------------------------------------------------------------------------
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

// Must match the project the client dev app + emulator use (see
// client/firebase/config.ts). Override with SEED_PROJECT_ID if needed —
// NOT FIREBASE_PROJECT_ID, which points at staging for other scripts.
const projectId = process.env.SEED_PROJECT_ID || "rookies-fantasy-development";

console.log(`🔧 Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`📁 Project: ${projectId}`);

initializeApp({ projectId });
const db = getFirestore();
const auth = getAuth();

// Shared password for every seeded user (Auth emulator only).
const USER_PASSWORD = "Test1234";

const api = new BalldontlieAPI({ apiKey: process.env.BALLDONTLIE_API_KEY });
const SEASON = 2024;
const TEAM_BALANCE = 150000000;

// ---------------------------------------------------------------------------
// Curated star pool — positions are authoritative (BallDontLie only gives G/F/C)
// ---------------------------------------------------------------------------
const PLAYER_POOL = [
  { name: "Stephen Curry", positions: ["PG", "SG"] },
  { name: "Luka Doncic", positions: ["PG", "SG"] },
  { name: "Ja Morant", positions: ["PG"] },
  { name: "Trae Young", positions: ["PG"] },
  { name: "Tyrese Haliburton", positions: ["PG"] },
  { name: "Shai Gilgeous-Alexander", positions: ["PG", "SG"] },
  { name: "Damian Lillard", positions: ["PG"] },
  { name: "Anthony Edwards", positions: ["SG", "SF"] },
  { name: "Devin Booker", positions: ["SG"] },
  { name: "Donovan Mitchell", positions: ["SG"] },
  { name: "Jalen Green", positions: ["SG"] },
  { name: "Bradley Beal", positions: ["SG"] },
  { name: "LeBron James", positions: ["SF", "PF"] },
  { name: "Jayson Tatum", positions: ["SF", "PF"] },
  { name: "Kevin Durant", positions: ["SF", "PF"] },
  { name: "Jimmy Butler", positions: ["SF"] },
  { name: "Paul George", positions: ["SF"] },
  { name: "Brandon Ingram", positions: ["SF"] },
  { name: "Giannis Antetokounmpo", positions: ["PF", "C"] },
  { name: "Anthony Davis", positions: ["PF", "C"] },
  { name: "Pascal Siakam", positions: ["PF"] },
  { name: "Paolo Banchero", positions: ["PF"] },
  { name: "Nikola Jokic", positions: ["C"] },
  { name: "Joel Embiid", positions: ["C"] },
  { name: "Bam Adebayo", positions: ["C", "PF"] },
  { name: "Rudy Gobert", positions: ["C"] },
  { name: "Karl-Anthony Towns", positions: ["C", "PF"] },
  { name: "Victor Wembanyama", positions: ["C", "PF"] },
];

// ---------------------------------------------------------------------------
// Augments (kept in sync with client/types/augment.ts)
// ---------------------------------------------------------------------------
const sampleAugments = [
  {
    id: "block-party",
    title: "Block Party",
    description: "Build your team with 3 players averaging 1+ BLK per game.",
    iconUrl: "block-party.png",
    info: "Only those 3 players gain +25% to BLK.",
    isActive: true,
    playerCount: 3,
    prerequisites: [
      {
        type: "statThreshold",
        condition: { count: 3, stat: "blocks", operator: ">=", value: 1 },
        description: "3 players averaging 1+ BLK per game",
      },
    ],
    effects: [{ statBoosts: [{ stat: "blocks", multiplier: 1.25 }] }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "frontcourt-focus",
    title: "Frontcourt Focus",
    description:
      "Build your team with 3 Forwards or Centers each averaging 8+ REB per game.",
    iconUrl: "frontcourt-focus.png",
    info: "Only those 3 players gain +20% to REB.",
    isActive: true,
    playerCount: 3,
    prerequisites: [
      {
        type: "positionRequirement",
        condition: { count: 3, position: ["SF", "PF", "C"] },
        description: "3 Forwards or Centers",
      },
      {
        type: "statThreshold",
        condition: { count: 3, stat: "rebounds", operator: ">=", value: 8 },
        description: "averaging 8+ REB per game",
      },
    ],
    effects: [{ statBoosts: [{ stat: "rebounds", multiplier: 1.2 }] }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ---------------------------------------------------------------------------
// BallDontLie helpers
// ---------------------------------------------------------------------------
const normalizeTeam = (team) => ({
  id: team.id.toString(),
  abbreviation: team.abbreviation,
  city: team.city,
  conference: team.conference,
  division: team.division,
  fullName: team.full_name,
  name: team.name,
  state: "",
  logoUrl: "",
});

const fetchTeams = async () => {
  const response = await api.nba.getTeams();
  const teams = (response.data ?? []).filter(
    (t) => t.division && t.division.trim() !== "",
  );
  return teams.map(normalizeTeam);
};

// Fetch all active players once, then match our curated names against them.
const fetchActivePlayersByName = async (names) => {
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const found = new Map(); // fullNameLower -> raw player
  let cursor = undefined;

  do {
    const response = await api.nba.getActivePlayers({ cursor, per_page: 100 });
    const players = response.data ?? [];
    for (const p of players) {
      const key = `${p.first_name} ${p.last_name}`.toLowerCase();
      if (wanted.has(key) && !found.has(key)) found.set(key, p);
    }
    cursor = response.meta?.next_cursor;
  } while (cursor && found.size < wanted.size);

  return found;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const fetchSeasonAverages = async (playerIds) => {
  const byId = new Map();
  for (const ids of chunk(playerIds, 25)) {
    const query = ids.map((id) => `player_ids[]=${id}`).join("&");
    const url = `https://api.balldontlie.io/v1/season_averages/general?season=${SEASON}&season_type=regular&type=base&${query}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` },
    });
    const json = await res.json();
    for (const row of json.data ?? []) byId.set(row.player.id.toString(), row.stats);
  }
  return byId;
};

// ---------------------------------------------------------------------------
// Stat / salary math (mirrors fillFPTS.js + fillSalaries.js)
// ---------------------------------------------------------------------------
const round1 = (v) => parseFloat(v.toFixed(1));

const buildAverageStats = (stats, positions) => {
  // Fallback line when a player has no 2024 season averages, scaled loosely by
  // position so salaries/FPTS stay sensible instead of collapsing to zero.
  const isBig = positions.some((p) => p === "C" || p === "PF");
  const fallback = {
    min: 30,
    fgm: 7,
    fga: 15,
    fg_pct: 0.47,
    fta: 4,
    ftm: 3,
    ft_pct: 0.78,
    fg3a: isBig ? 2 : 6,
    fg3m: isBig ? 0.7 : 2.3,
    fg3_pct: 0.36,
    reb: isBig ? 9 : 4,
    ast: isBig ? 3 : 6,
    stl: 1,
    blk: isBig ? 1.2 : 0.5,
    tov: 2.5,
    pf: 2.5,
    pts: 20,
    gp: 60,
  };
  const s = stats ?? fallback;

  const averageStats = {
    minutes: s.min,
    fieldGoalsMade: s.fgm,
    fieldGoalsAttempted: s.fga,
    fieldGoalPercentage: s.fg_pct,
    freeThrowsAttempted: s.fta,
    freeThrowsMade: s.ftm,
    freeThrowPercentage: s.ft_pct,
    threePointersAttempted: s.fg3a,
    threePointersMade: s.fg3m,
    threePointerPercentage: s.fg3_pct,
    rebounds: s.reb,
    assists: s.ast,
    steals: s.stl,
    blocks: s.blk,
    turnovers: s.tov,
    personalFouls: s.pf,
    points: s.pts,
  };

  const fpts =
    averageStats.points +
    averageStats.rebounds +
    averageStats.assists * 2 +
    averageStats.steals * 4 +
    averageStats.blocks * 4 +
    averageStats.fieldGoalsMade * 2 +
    averageStats.freeThrowsMade +
    averageStats.threePointersMade -
    averageStats.turnovers * 2 -
    averageStats.fieldGoalsAttempted -
    averageStats.freeThrowsAttempted;

  averageStats.fantasyPoints = round1(fpts);
  return { averageStats, gamesPlayed: s.gp ?? 0 };
};

const linearScale = (fpts, minF, maxF, minS, maxS) =>
  (minS + ((fpts - minF) * (maxS - minS)) / (maxF - minF)) * 1000000;

const roundToHundredThousand = (v) => Math.round(v / 100000) * 100000;

const calculateSalary = (fpts) => {
  if (fpts === undefined || fpts === null || isNaN(fpts) || fpts < 0) return 1;
  let raw;
  if (fpts >= 50) raw = (35 + (fpts - 50) * 0.67) * 1000000;
  else if (fpts >= 35) raw = linearScale(fpts, 35, 50, 25, 35);
  else if (fpts >= 25) raw = linearScale(fpts, 25, 35, 15, 25);
  else if (fpts >= 15) raw = linearScale(fpts, 15, 25, 10, 15);
  else if (fpts >= 5) raw = linearScale(fpts, 5, 15, 5, 10);
  else raw = linearScale(fpts, 0, 5, 1, 5);
  return roundToHundredThousand(raw);
};

// ---------------------------------------------------------------------------
// Build the enriched seed-player objects from live data
// ---------------------------------------------------------------------------
const buildSeededPlayers = async (teams) => {
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  console.log("🌐 Matching curated players against active players...");
  const names = PLAYER_POOL.map((p) => p.name);
  const rawByName = await fetchActivePlayersByName(names);
  console.log(`   ✓ matched ${rawByName.size}/${names.length}`);

  const matched = PLAYER_POOL.map((entry) => {
    const raw = rawByName.get(entry.name.toLowerCase());
    return raw ? { entry, raw } : null;
  }).filter(Boolean);

  const missing = PLAYER_POOL.filter(
    (p) => !rawByName.has(p.name.toLowerCase()),
  );
  if (missing.length) {
    console.log(`   ⚠ not found (skipped): ${missing.map((m) => m.name).join(", ")}`);
  }

  console.log("🌐 Fetching 2024 season averages...");
  const playerIds = matched.map(({ raw }) => raw.id.toString());
  const statsById = await fetchSeasonAverages(playerIds);
  console.log(`   ✓ averages for ${statsById.size} players`);

  return matched.map(({ entry, raw }) => {
    const id = raw.id.toString();
    const teamId = raw.team.id.toString();
    const team = teamsById.get(teamId);
    const { averageStats, gamesPlayed } = buildAverageStats(
      statsById.get(id),
      entry.positions,
    );
    return {
      id,
      firstName: raw.first_name,
      firstNameLower: raw.first_name.toLowerCase(),
      lastName: raw.last_name,
      lastNameLower: raw.last_name.toLowerCase(),
      fullNameLower: `${raw.first_name} ${raw.last_name}`.toLowerCase(),
      positions: entry.positions,
      teamId,
      teamAbbreviation: team?.abbreviation ?? raw.team.abbreviation ?? "",
      height: raw.height ?? "",
      weight: raw.weight ?? "",
      jerseyNumber: raw.jersey_number ?? "",
      country: raw.country ?? "",
      headshotURL: "",
      gamesPlayed,
      averageStats,
      salary: calculateSalary(averageStats.fantasyPoints),
    };
  });
};

// ---------------------------------------------------------------------------
// Lineup / snapshot builders
// ---------------------------------------------------------------------------
// The app stores full Player objects in the lineup at runtime (typed as
// PlayerTeamDisplay, but dispatched straight from the Player list — see
// client/app/(protected)/(draft)/(teamBuilder)/players.tsx). Augment
// validation reads player.averageStats, so lineup players MUST carry it or
// selectIsAugmentValid crashes ("Cannot read property 'blocks' of undefined").
const toDisplay = (p) => ({
  id: p.id,
  firstName: p.firstName,
  lastName: p.lastName,
  headshotUrl: p.headshotURL,
  positions: p.positions,
  salary: p.salary,
  teamAbbreviation: p.teamAbbreviation,
  teamId: p.teamId,
  height: p.height,
  weight: p.weight,
  jerseyNumber: p.jerseyNumber,
  gamesPlayed: p.gamesPlayed,
  averageStats: p.averageStats,
});

const STARTER_SLOTS = ["PG", "SG", "SF", "PF", "C"];
const UTIL_SLOTS = ["UTIL1", "UTIL2", "UTIL3"];

// Picks a distinct 5-man starting lineup (+ up to 3 UTIL/bench) from the pool,
// rotating a cursor so successive teams get different players where possible.
const makeTeamSelection = (pool, cursorRef) => {
  const used = new Set();
  const canPlay = (p, slot) => p.positions.includes(slot);

  const pickFor = (slot) => {
    const n = pool.length;
    for (let i = 0; i < n; i++) {
      const p = pool[(cursorRef.value + i) % n];
      if (!used.has(p.id) && canPlay(p, slot)) {
        used.add(p.id);
        cursorRef.value = (cursorRef.value + i + 1) % n;
        return p;
      }
    }
    // Fallback: any unused player, else any player.
    const anyUnused = pool.find((p) => !used.has(p.id));
    const chosen = anyUnused ?? pool[cursorRef.value % n];
    used.add(chosen.id);
    return chosen;
  };

  const starters = STARTER_SLOTS.map(pickFor);
  const util = [];
  for (let i = 0; i < 3; i++) {
    const anyUnused = pool.find((p) => !used.has(p.id));
    if (!anyUnused) break;
    used.add(anyUnused.id);
    util.push(anyUnused);
  }
  return { starters, util };
};

const buildLineup = ({ starters, util }) => {
  const lineup = STARTER_SLOTS.map((position, i) => ({
    position,
    player: toDisplay(starters[i]),
  }));
  UTIL_SLOTS.forEach((position, i) => {
    lineup.push({ position, player: util[i] ? toDisplay(util[i]) : null });
  });
  return lineup;
};

const buildBench = (util) =>
  util.map((p, i) => ({ position: `BEN${i + 1}`, player: toDisplay(p) }));

// A single realistic game line derived from a player's season averages.
const generateGameStats = (avg) => {
  const vary = (v, pct = 0.35) =>
    Math.max(0, v * (1 + (Math.random() * 2 - 1) * pct));
  const points = Math.round(vary(avg.points));
  const rebounds = Math.round(vary(avg.rebounds));
  const assists = Math.round(vary(avg.assists));
  const steals = Math.round(vary(avg.steals, 0.6));
  const blocks = Math.round(vary(avg.blocks, 0.6));
  const turnovers = Math.round(vary(avg.turnovers, 0.5));
  const minutes = Math.round(vary(avg.minutes, 0.15));
  const fantasyPoints =
    points + rebounds + assists * 2 + steals * 3 + blocks * 3 - turnovers * 2;
  return { points, rebounds, assists, steals, blocks, turnovers, minutes, fantasyPoints };
};

// Builds { [gameDate]: LineupSnapshotItem[] } and the total score for it.
const buildLineupSnapshots = (starters, gameDate, isHome, opponentAbbr) => {
  const items = STARTER_SLOTS.map((position, i) => {
    const p = starters[i];
    const gameStats = generateGameStats(p.averageStats);
    return {
      position,
      playerSnapshot: {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        headshotUrl: p.headshotURL,
        positions: p.positions,
        salary: p.salary,
        gameStats,
        gameInfo: {
          gameStatus: true,
          opponent: opponentAbbr,
          gameDate,
          isHome,
        },
      },
    };
  });
  const score = items.reduce(
    (sum, it) => sum + it.playerSnapshot.gameStats.fantasyPoints,
    0,
  );
  return { snapshots: { [gameDate]: items }, score: round1(score) };
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
const fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const mondayOf = (offsetWeeks = 0) => {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // back to Monday
  d.setDate(d.getDate() + diff + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ---------------------------------------------------------------------------
// Users / teams config
// ---------------------------------------------------------------------------
// avatarUrl / logoUrl values must match entries in client/types/asset.ts
// (avatarOptions / teamLogoOptions) so the app resolves them to real assets;
// otherwise it falls back to the default placeholder. dob is stored as a
// Firestore Timestamp because UserController.getUser reads dateOfBirth.toDate().
const USERS = [
  { id: "mock-user-1", username: "courtvision", email: "user1@test.com", augmentId: "block-party", avatarUrl: "../assets/images/profile/1.png", logoUrl: "../assets/images/team/2.png", dob: "1998-03-14" },
  { id: "mock-user-2", username: "dimedropper", email: "user2@test.com", augmentId: "frontcourt-focus", avatarUrl: "../assets/images/profile/2.png", logoUrl: "../assets/images/team/3.png", dob: "1996-07-22" },
  { id: "mock-user-3", username: "swishking", email: "user3@test.com", augmentId: "block-party", avatarUrl: "../assets/images/profile/3.png", logoUrl: "../assets/images/team/4.png", dob: "2000-11-02" },
  { id: "mock-user-4", username: "glasscleaner", email: "user4@test.com", augmentId: "frontcourt-focus", avatarUrl: "../assets/images/profile/4.png", logoUrl: "../assets/images/team/5.png", dob: "1994-01-30" },
  { id: "mock-user-5", username: "pickandroll", email: "user5@test.com", augmentId: "block-party", avatarUrl: "../assets/images/profile/5.png", logoUrl: "../assets/images/team/6.png", dob: "1999-05-18" },
  { id: "mock-user-6", username: "fastbreak", email: "user6@test.com", augmentId: "frontcourt-focus", avatarUrl: "../assets/images/profile/6.png", logoUrl: "../assets/images/team/7.png", dob: "1997-09-09" },
];

const userById = (id) => USERS.find((u) => u.id === id);

const randomRecord = () => {
  const wins = Math.floor(Math.random() * 8);
  const losses = Math.floor(Math.random() * 8);
  return { wins, losses, draws: Math.floor(Math.random() * 2) };
};

// ---------------------------------------------------------------------------
// Clearing
// ---------------------------------------------------------------------------
const clearCollection = async (name) => {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

const clearSeedData = async () => {
  console.log("\n🧹 Clearing existing seed data...");
  for (const name of ["nbaTeams", "nbaPlayers", "augments", "matchups", "leagues"]) {
    await clearCollection(name);
  }
  // Users + their teams subcollections
  for (const u of USERS) {
    const teams = await db.collection("users").doc(u.id).collection("teams").get();
    const batch = db.batch();
    teams.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection("users").doc(u.id));
    await batch.commit();
  }
  console.log("   ✓ cleared");
};

// ---------------------------------------------------------------------------
// Injectors
// ---------------------------------------------------------------------------
const injectTeamsAndPlayers = async (seededPlayers, teams) => {
  console.log("\n📊 Injecting nbaTeams + nbaPlayers...");
  let batch = db.batch();
  teams.forEach((t) => batch.set(db.collection("nbaTeams").doc(t.id), t));
  await batch.commit();

  batch = db.batch();
  seededPlayers.forEach((p) => batch.set(db.collection("nbaPlayers").doc(p.id), p));
  await batch.commit();
  console.log(`   ✓ ${teams.length} teams, ${seededPlayers.length} players`);
};

const injectAugments = async () => {
  console.log("🎯 Injecting augments...");
  const batch = db.batch();
  sampleAugments.forEach((a) => batch.set(db.collection("augments").doc(a.id), a));
  await batch.commit();
  console.log(`   ✓ ${sampleAugments.length} augments`);
};

// Creates a team doc in users/{userId}/teams and returns { teamId, selection }.
const createTeamDoc = async (userId, { name, abbreviation, logoUrl, augmentId, isLeagueTeam, selection }) => {
  const teamRef = db.collection("users").doc(userId).collection("teams").doc();
  await teamRef.set({
    id: teamRef.id,
    name,
    abbreviation,
    logoUrl,
    balance: TEAM_BALANCE,
    augmentId,
    isLeagueTeam: isLeagueTeam ?? false,
    record: randomRecord(),
    lineup: buildLineup(selection),
    bench: buildBench(selection.util),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return teamRef.id;
};

// Creates Auth-emulator accounts whose UID == the Firestore user doc id, so
// logging in as user1@test.com / Test1234 resolves to the seeded user doc.
const injectAuthUsers = async () => {
  console.log("🔐 Injecting Auth accounts (password: " + USER_PASSWORD + ")...");
  for (const u of USERS) {
    try {
      await auth.deleteUser(u.id);
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }
    await auth.createUser({
      uid: u.id,
      email: u.email,
      emailVerified: true,
      password: USER_PASSWORD,
      displayName: u.username,
    });
  }
  console.log(`   ✓ ${USERS.length} Auth accounts`);
};

const injectUsersAndTeams = async (seededPlayers) => {
  console.log("👥 Injecting users + ranked teams...");
  const cursor = { value: 0 };
  const result = {};

  for (const u of USERS) {
    const selection = makeTeamSelection(seededPlayers, cursor);
    const teamId = await createTeamDoc(u.id, {
      name: `${u.username}'s Squad`,
      abbreviation: u.username.slice(0, 3).toUpperCase(),
      logoUrl: u.logoUrl,
      augmentId: u.augmentId,
      isLeagueTeam: false,
      selection,
    });

    await db.collection("users").doc(u.id).set({
      id: u.id,
      username: u.username,
      email: u.email,
      emailVerified: true,
      // Stored as Timestamp (Date) — getUser reads dateOfBirth.toDate().
      dateOfBirth: new Date(u.dob),
      avatarUrl: u.avatarUrl,
      queueStatus: "idle",
      teamId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    result[u.id] = { teamId, selection };
  }
  console.log(`   ✓ ${USERS.length} users with ranked teams`);
  return result;
};

// Augment embedded in a TeamSnapshot: drop createdAt/updatedAt, which the
// Augment type declares as string but would persist here as Timestamps
// (matchups are read via a direct `as Matchup` cast with no field mapping).
const augmentSnapshotOf = (augmentId) => {
  const aug = sampleAugments.find((a) => a.id === augmentId);
  if (!aug) return null;
  const { createdAt, updatedAt, ...rest } = aug;
  return rest;
};

const injectMatchup = async ({ id, home, away, status, weekStart, gameDate }) => {
  const opp = (abbr) => abbr || "OPP";
  const homeSnap = buildLineupSnapshots(
    home.selection.starters,
    gameDate,
    true,
    opp(away.selection.starters[0]?.teamAbbreviation),
  );
  const awaySnap = buildLineupSnapshots(
    away.selection.starters,
    gameDate,
    false,
    opp(home.selection.starters[0]?.teamAbbreviation),
  );

  const data = {
    id,
    createdAt: new Date(),
    status,
    weekStart,
    homeUserId: home.userId,
    awayUserId: away.userId,
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeTeamSnapshot: {
      name: home.name,
      logoUrl: home.logoUrl,
      record: home.record,
      augmentSnapshot: augmentSnapshotOf(home.augmentId),
    },
    awayTeamSnapshot: {
      name: away.name,
      logoUrl: away.logoUrl,
      record: away.record,
      augmentSnapshot: augmentSnapshotOf(away.augmentId),
    },
    homeLineupSnapshots: homeSnap.snapshots,
    awayLineupSnapshots: awaySnap.snapshots,
    homeScore: homeSnap.score,
    awayScore: awaySnap.score,
  };

  if (status === "completed") {
    data.winnerId =
      homeSnap.score >= awaySnap.score ? home.userId : away.userId;
  }

  await db.collection("matchups").doc(id).set(data);
  return { id, status, home: homeSnap.score, away: awaySnap.score };
};

const injectMatchups = async (teamsByUser) => {
  console.log("⚔️  Injecting matchups...");
  const thisWeek = fmt(mondayOf(0));
  const lastWeek = fmt(mondayOf(-1));
  const activeGameDate = fmt(new Date());
  const completedGameDate = fmt(mondayOf(-1));

  const userMeta = (uid) => {
    const u = userById(uid);
    return {
      userId: uid,
      teamId: teamsByUser[uid].teamId,
      selection: teamsByUser[uid].selection,
      name: `${u.username}'s Squad`,
      logoUrl: u.logoUrl,
      augmentId: u.augmentId,
      record: randomRecord(),
    };
  };

  const active = await injectMatchup({
    id: "mock-matchup-active",
    home: userMeta("mock-user-1"),
    away: userMeta("mock-user-2"),
    status: "active",
    weekStart: thisWeek,
    gameDate: activeGameDate,
  });

  const completed = await injectMatchup({
    id: "mock-matchup-completed",
    home: userMeta("mock-user-3"),
    away: userMeta("mock-user-4"),
    status: "completed",
    weekStart: lastWeek,
    gameDate: completedGameDate,
  });

  // Point the two active-matchup users at it.
  await db.collection("users").doc("mock-user-1").update({ currentMatchupId: active.id });
  await db.collection("users").doc("mock-user-2").update({ currentMatchupId: active.id });

  console.log(
    `   ✓ active ${active.home}-${active.away}, completed ${completed.home}-${completed.away}`,
  );
};

const injectLeague = async (seededPlayers) => {
  console.log("🏆 Injecting league + league teams...");
  const memberIds = ["mock-user-1", "mock-user-2", "mock-user-5", "mock-user-6"];
  const cursor = { value: 7 }; // offset so league teams differ from ranked ones
  const teamIds = [];

  for (const uid of memberIds) {
    const u = userById(uid);
    const selection = makeTeamSelection(seededPlayers, cursor);
    const teamId = await createTeamDoc(uid, {
      name: `${u.username} (League)`,
      abbreviation: u.username.slice(0, 3).toUpperCase(),
      logoUrl: u.logoUrl,
      augmentId: u.augmentId,
      isLeagueTeam: true,
      selection,
    });
    teamIds.push(teamId);
  }

  await db.collection("leagues").doc("mock-league-1").set({
    name: "Rookies Invitational",
    creatorUserId: memberIds[0],
    numberOfTeams: 4,
    budget: TEAM_BALANCE,
    memberCount: memberIds.length,
    teamIds,
    userIds: memberIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`   ✓ league with ${memberIds.length} teams`);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const main = async () => {
  try {
    console.log("🚀 Seeding mock data...");
    console.log("\n🌐 Fetching teams from BallDontLie...");
    const teams = await fetchTeams();
    console.log(`   ✓ ${teams.length} teams`);
    const seededPlayers = await buildSeededPlayers(teams);

    if (seededPlayers.length < 10) {
      throw new Error(
        `Only ${seededPlayers.length} players resolved — aborting (check BallDontLie key/tier).`,
      );
    }

    await clearSeedData();
    await injectTeamsAndPlayers(seededPlayers, teams);
    await injectAugments();
    await injectAuthUsers();
    const teamsByUser = await injectUsersAndTeams(seededPlayers);
    await injectMatchups(teamsByUser);
    await injectLeague(seededPlayers);

    console.log("\n✨ Seed complete!");
    console.log("📋 Summary:");
    console.log(`   - ${teams.length} NBA teams`);
    console.log(`   - ${seededPlayers.length} NBA players`);
    console.log(`   - ${sampleAugments.length} augments`);
    console.log(`   - ${USERS.length} users (Auth + Firestore, each with a ranked team)`);
    console.log(`   - 2 matchups (1 active, 1 completed)`);
    console.log(`   - 1 league (4 teams)`);
    console.log("\n🔑 Login with any of:");
    USERS.forEach((u) => console.log(`   - ${u.email}  /  ${USER_PASSWORD}`));
    console.log("\n💡 Emulator UI: http://localhost:4000\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

main();
