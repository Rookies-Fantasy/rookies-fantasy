import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For emulator, we don't need service account
// Just initialize with project ID
const useEmulator = process.env.USE_EMULATOR === "true";

if (useEmulator) {
  console.log("🔧 Using Firebase Emulator");
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  initializeApp({ projectId: "rookies-fantasy-development" });
} else {
  console.log("📡 Using Production Firebase");
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  const serviceAccountJSON = await readFile(serviceAccountPath, "utf-8");
  const serviceAccount = JSON.parse(serviceAccountJSON);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// ============================================
// SAMPLE DATA DEFINITIONS
// ============================================

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
        condition: {
          count: 3,
          stat: "blocks",
          operator: ">=",
          value: 1,
        },
        description: "3 players averaging 1+ BLK per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "blocks",
            multiplier: 1.25,
          },
        ],
      },
    ],
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
        condition: {
          count: 3,
          position: ["SF", "PF", "C"],
        },
        description: "3 Forwards or Centers",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "rebounds",
          operator: ">=",
          value: 8,
        },
        description: "averaging 8+ REB per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.2,
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Real NBA players with realistic stats
const samplePlayers = [
  {
    playerId: "237", // LeBron James
    firstName: "LeBron",
    lastName: "James",
    positions: ["SF", "PF"],
    teamId: 13, // Lakers
    teamAbbreviation: "LAL",
    headshotUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
    height: "6-9",
    weight: "250",
    jerseyNumber: "23",
    salary: 12000000,
    gamesPlayed: 35,
    averageStats: {
      assists: 6.8,
      blocks: 0.6,
      freeThrowPercentage: 0.75,
      freeThrowsAttempted: 7.2,
      freeThrowsMade: 5.4,
      fieldGoalPercentage: 0.52,
      fieldGoalsAttempted: 18.5,
      fieldGoalsMade: 9.6,
      minutes: 35.2,
      personalFouls: 1.8,
      points: 25.3,
      rebounds: 8.1,
      steals: 1.3,
      threePointerPercentage: 0.38,
      threePointersAttempted: 5.8,
      threePointersMade: 2.2,
      turnovers: 3.5,
    },
    gamelog: [],
  },
  {
    playerId: "203507", // Giannis Antetokounmpo
    firstName: "Giannis",
    lastName: "Antetokounmpo",
    positions: ["PF", "C"],
    teamId: 15, // Bucks
    teamAbbreviation: "MIL",
    headshotUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
    height: "6-11",
    weight: "243",
    jerseyNumber: "34",
    salary: 15000000,
    gamesPlayed: 38,
    averageStats: {
      assists: 5.8,
      blocks: 1.4,
      freeThrowPercentage: 0.65,
      freeThrowsAttempted: 10.2,
      freeThrowsMade: 6.6,
      fieldGoalPercentage: 0.61,
      fieldGoalsAttempted: 20.1,
      fieldGoalsMade: 12.3,
      minutes: 34.5,
      personalFouls: 3.2,
      points: 31.2,
      rebounds: 11.9,
      steals: 1.1,
      threePointerPercentage: 0.28,
      threePointersAttempted: 3.5,
      threePointersMade: 1.0,
      turnovers: 3.8,
    },
    gamelog: [],
  },
  {
    playerId: "1629029", // Luka Doncic
    firstName: "Luka",
    lastName: "Doncic",
    positions: ["PG", "SG"],
    teamId: 6, // Mavericks
    teamAbbreviation: "DAL",
    headshotUrl:
      "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png",
    height: "6-7",
    weight: "230",
    jerseyNumber: "77",
    salary: 13000000,
    gamesPlayed: 36,
    averageStats: {
      assists: 8.2,
      blocks: 0.5,
      freeThrowPercentage: 0.78,
      freeThrowsAttempted: 8.5,
      freeThrowsMade: 6.6,
      fieldGoalPercentage: 0.47,
      fieldGoalsAttempted: 21.3,
      fieldGoalsMade: 10.0,
      minutes: 36.8,
      personalFouls: 2.1,
      points: 28.5,
      rebounds: 8.3,
      steals: 1.4,
      threePointerPercentage: 0.36,
      threePointersAttempted: 9.8,
      threePointersMade: 3.5,
      turnovers: 4.0,
    },
    gamelog: [],
  },
  {
    playerId: "1630162", // Anthony Edwards
    firstName: "Anthony",
    lastName: "Edwards",
    positions: ["SG", "SF"],
    teamId: 16, // Timberwolves
    teamAbbreviation: "MIN",
    headshotUrl:
      "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png",
    height: "6-4",
    weight: "225",
    jerseyNumber: "5",
    salary: 10000000,
    gamesPlayed: 37,
    averageStats: {
      assists: 5.1,
      blocks: 0.6,
      freeThrowPercentage: 0.83,
      freeThrowsAttempted: 6.8,
      freeThrowsMade: 5.6,
      fieldGoalPercentage: 0.46,
      fieldGoalsAttempted: 20.5,
      fieldGoalsMade: 9.4,
      minutes: 35.6,
      personalFouls: 2.3,
      points: 26.1,
      rebounds: 5.4,
      steals: 1.3,
      threePointerPercentage: 0.42,
      threePointersAttempted: 8.9,
      threePointersMade: 3.7,
      turnovers: 3.2,
    },
    gamelog: [],
  },
  {
    playerId: "1628389", // Bam Adebayo
    firstName: "Bam",
    lastName: "Adebayo",
    positions: ["C", "PF"],
    teamId: 14, // Heat
    teamAbbreviation: "MIA",
    headshotUrl:
      "https://cdn.nba.com/headshots/nba/latest/1040x760/1628389.png",
    height: "6-9",
    weight: "255",
    jerseyNumber: "13",
    salary: 11000000,
    gamesPlayed: 36,
    averageStats: {
      assists: 3.8,
      blocks: 1.1,
      freeThrowPercentage: 0.72,
      freeThrowsAttempted: 5.2,
      freeThrowsMade: 3.7,
      fieldGoalPercentage: 0.56,
      fieldGoalsAttempted: 13.5,
      fieldGoalsMade: 7.6,
      minutes: 33.4,
      personalFouls: 2.8,
      points: 18.9,
      rebounds: 10.2,
      steals: 1.2,
      threePointerPercentage: 0.15,
      threePointersAttempted: 0.8,
      threePointersMade: 0.1,
      turnovers: 2.5,
    },
    gamelog: [],
  },
];

// Yesterday's date for gamelog
const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

const yesterday = getYesterday();

// Sample gamelog data for yesterday
const sampleGamelogs = [
  {
    playerId: "666969", // Zion
    date: yesterday,
    gameId: 12345,
    homeTeamId: 13,
    visitorTeamId: 5,
    teamId: 13,
    assists: 8,
    blocks: 1,
    fantasyPoints: 58.5,
    fieldGoalPercentage: 0.54,
    fieldGoalsAttempted: 22,
    fieldGoalsMade: 12,
    freeThrowPerfectange: 0.8,
    freeThrowsAttempted: 5,
    freeThrowsMade: 4,
    minutes: 38,
    personalFouls: 2,
    points: 32,
    rebounds: 9,
    steals: 2,
    threePointerPercentage: 0.4,
    threePointersAttempted: 5,
    threePointersMade: 2,
    turnovers: 4,
  },
  {
    playerId: "203507", // Giannis
    date: yesterday,
    gameId: 12346,
    homeTeamId: 15,
    visitorTeamId: 8,
    teamId: 15,
    assists: 6,
    blocks: 2,
    fantasyPoints: 72.3,
    fieldGoalPercentage: 0.64,
    fieldGoalsAttempted: 25,
    fieldGoalsMade: 16,
    freeThrowPerfectange: 0.7,
    freeThrowsAttempted: 10,
    freeThrowsMade: 7,
    minutes: 36,
    personalFouls: 3,
    points: 39,
    rebounds: 14,
    steals: 1,
    threePointerPercentage: 0.0,
    threePointersAttempted: 2,
    threePointersMade: 0,
    turnovers: 5,
  },
  {
    playerId: "1629029", // Luka
    date: yesterday,
    gameId: 12347,
    homeTeamId: 6,
    visitorTeamId: 20,
    teamId: 6,
    assists: 10,
    blocks: 0,
    fantasyPoints: 65.2,
    fieldGoalPercentage: 0.48,
    fieldGoalsAttempted: 23,
    fieldGoalsMade: 11,
    freeThrowPerfectange: 0.85,
    freeThrowsAttempted: 7,
    freeThrowsMade: 6,
    minutes: 39,
    personalFouls: 2,
    points: 31,
    rebounds: 9,
    steals: 2,
    threePointerPercentage: 0.375,
    threePointersAttempted: 8,
    threePointersMade: 3,
    turnovers: 3,
  },
  {
    playerId: "1630162", // Anthony Edwards
    date: yesterday,
    gameId: 12348,
    homeTeamId: 10,
    visitorTeamId: 16,
    teamId: 16,
    assists: 6,
    blocks: 1,
    fantasyPoints: 54.8,
    fieldGoalPercentage: 0.47,
    fieldGoalsAttempted: 19,
    fieldGoalsMade: 9,
    freeThrowPerfectange: 0.88,
    freeThrowsAttempted: 8,
    freeThrowsMade: 7,
    minutes: 37,
    personalFouls: 2,
    points: 29,
    rebounds: 6,
    steals: 1,
    threePointerPercentage: 0.44,
    threePointersAttempted: 9,
    threePointersMade: 4,
    turnovers: 2,
  },
  {
    playerId: "1628389", // Bam
    date: yesterday,
    gameId: 12349,
    homeTeamId: 14,
    visitorTeamId: 2,
    teamId: 14,
    assists: 5,
    blocks: 3,
    fantasyPoints: 48.7,
    fieldGoalPercentage: 0.6,
    fieldGoalsAttempted: 15,
    fieldGoalsMade: 9,
    freeThrowPerfectange: 0.67,
    freeThrowsAttempted: 6,
    freeThrowsMade: 4,
    minutes: 34,
    personalFouls: 3,
    points: 22,
    rebounds: 11,
    steals: 1,
    threePointerPercentage: 0.0,
    threePointersAttempted: 1,
    threePointersMade: 0,
    turnovers: 2,
  },
];

// Helper to create lineup slots
const createLineupSlot = (position, player) => ({
  position,
  gameInfo: [],
  gameStats: [],
  player: player
    ? {
        id: player.playerId,
        firstName: player.firstName,
        lastName: player.lastName,
        positions: player.positions,
        teamId: player.teamId,
        teamAbbreviation: player.teamAbbreviation,
        headshotUrl: player.headshotUrl,
        height: player.height,
        weight: player.weight,
        jerseyNumber: player.jerseyNumber,
        salary: player.salary,
        gamesPlayed: player.gamesPlayed,
        averageStats: player.averageStats,
        gamelog: player.gamelog,
      }
    : null,
});

// ============================================
// INJECT FUNCTIONS
// ============================================

const injectNBAPlayers = async () => {
  console.log("\n📊 Injecting NBA Players...");
  const batch = db.batch();

  for (const player of samplePlayers) {
    const docRef = db.collection("nbaPlayers").doc();
    batch.set(docRef, player);
  }

  await batch.commit();
  console.log(`✅ Injected ${samplePlayers.length} NBA players`);
};

const injectAugments = async () => {
  console.log("\n🎯 Injecting Augments...");
  const batch = db.batch();

  for (const augment of sampleAugments) {
    const docRef = db.collection("augments").doc(augment.id);
    batch.set(docRef, augment);
  }

  await batch.commit();
  console.log(`✅ Injected ${sampleAugments.length} augments`);
};

const injectUsers = async () => {
  console.log("\n👥 Injecting Users and Teams...");

  const user1Id = "test-user-1";
  const user2Id = "test-user-2";
  const team1Id = "test-team-1";
  const team2Id = "test-team-2";

  // User 1
  await db.collection("users").doc(user1Id).set({
    id: user1Id,
    email: "user1@test.com",
    emailVerified: true,
    queueStatus: "idle",
    teamId: team1Id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // User 1 Team (with Block Party augment)
  await db
    .collection("users")
    .doc(user1Id)
    .collection("teams")
    .doc(team1Id)
    .set({
      id: team1Id,
      name: "Test Team 1",
      abbreviation: "TT1",
      logoUrl: "https://via.placeholder.com/150",
      balance: 30000000,
      augment: sampleAugments[0], // Block Party
      lineup: [
        createLineupSlot("PG", samplePlayers[2]), // Luka
        createLineupSlot("SG", samplePlayers[3]), // Anthony Edwards
        createLineupSlot("SF", samplePlayers[0]), // LeBron
        createLineupSlot("PF", samplePlayers[1]), // Giannis
        createLineupSlot("C", samplePlayers[4]), // Bam
        createLineupSlot("F", null),
        createLineupSlot("G", null),
        createLineupSlot("UTIL", null),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  // User 2
  await db.collection("users").doc(user2Id).set({
    id: user2Id,
    email: "user2@test.com",
    emailVerified: true,
    queueStatus: "idle",
    teamId: team2Id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // User 2 Team (with Frontcourt Focus augment)
  await db
    .collection("users")
    .doc(user2Id)
    .collection("teams")
    .doc(team2Id)
    .set({
      id: team2Id,
      name: "Test Team 2",
      abbreviation: "TT2",
      logoUrl: "https://via.placeholder.com/150",
      balance: 35000000,
      augment: sampleAugments[1], // Frontcourt Focus
      lineup: [
        createLineupSlot("PG", null),
        createLineupSlot("SG", null),
        createLineupSlot("SF", samplePlayers[0]), // LeBron
        createLineupSlot("PF", samplePlayers[1]), // Giannis
        createLineupSlot("C", samplePlayers[4]), // Bam
        createLineupSlot("F", null),
        createLineupSlot("G", null),
        createLineupSlot("UTIL", null),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  console.log(`✅ Injected 2 users with teams`);

  return { user1Id, user2Id, team1Id, team2Id };
};

const injectMatchup = async (user1Id, user2Id, team1Id, team2Id) => {
  console.log("\n⚔️  Injecting Matchup...");

  // Calculate "yesterday" in Pacific Time (same as cloud function)
  const now = new Date();
  const pacificNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  pacificNow.setDate(pacificNow.getDate() - 1);

  const yyyy = pacificNow.getFullYear();
  const mm = String(pacificNow.getMonth() + 1).padStart(2, "0");
  const dd = String(pacificNow.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  console.log(`📅 Creating matchup data for date: ${today}`);
  const matchupId = "test-matchup-1";

  // Get team data
  const team1Doc = await db
    .collection("users")
    .doc(user1Id)
    .collection("teams")
    .doc(team1Id)
    .get();

  const team2Doc = await db
    .collection("users")
    .doc(user2Id)
    .collection("teams")
    .doc(team2Id)
    .get();

  const team1Data = team1Doc.data();
  const team2Data = team2Doc.data();

  const matchupData = {
    id: matchupId,
    createdAt: new Date(),
    status: "active",
    weekStartDate: today,
    away: {
      awayAugment: team2Data.augment,
      awayTeamId: team2Id,
      awayTeamLogo: team2Data.logoUrl,
      awayTeamName: team2Data.name,
      awayUserId: user2Id,
      awayWeeklyAcquisitionsUsed: 0,
    },
    home: {
      homeAugment: team1Data.augment,
      homeTeamId: team1Id,
      homeTeamLogo: team1Data.logoUrl,
      homeTeamName: team1Data.name,
      homeUserId: user1Id,
      homeWeeklyAcquisitionsUsed: 0,
    },
    [today]: {
      homeTeam: {
        score: 0,
        lineup: team1Data.lineup,
      },
      awayTeam: {
        score: 0,
        lineup: team2Data.lineup,
      },
    },
  };

  await db.collection("matchups").doc(matchupId).set(matchupData);

  console.log(`✅ Injected matchup for today (${today})`);
};

// ============================================
// MAIN FUNCTION
// ============================================

const injectAllData = async () => {
  try {
    console.log("🚀 Starting data injection...");
    console.log(`📅 Yesterday's date: ${yesterday}`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    if (useEmulator) {
      console.log("\n🧹 Clearing existing emulator data...");
      const collections = ["nbaPlayers", "augments", "users", "matchups"];
      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      console.log("✅ Cleared existing data");
    }

    // Inject data in order
    await injectNBAPlayers();
    await injectAugments();
    const { user1Id, user2Id, team1Id, team2Id } = await injectUsers();
    await injectMatchup(user1Id, user2Id, team1Id, team2Id);

    console.log("\n✨ Data injection complete!");
    console.log("\n📋 Summary:");
    console.log(`   - ${samplePlayers.length} NBA Players`);
    console.log(`   - ${sampleAugments.length} Augments`);
    console.log(`   - 2 Users with Teams`);
    console.log(`   - 1 Active Matchup`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Ensure emulator is running: firebase emulators:start`);
    console.log(
      `   2. Run the cloud function: npm run shell (in server/functions)`
    );
    console.log(`   3. Execute: updateDailyPlayerData()`);
    console.log(`   4. Check results in Emulator UI: http://localhost:4000\n`);
  } catch (error) {
    console.error("❌ Error injecting data:", error);
    process.exit(1);
  }

  process.exit(0);
};

// Run the injection
injectAllData();
