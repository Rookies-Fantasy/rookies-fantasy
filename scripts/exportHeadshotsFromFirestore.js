import { db } from "./firebaseConfig.js";
import { writeFileSync, mkdirSync, existsSync } from "fs";

/**
 * Exports headshot URLs from Firestore nbaPlayers collection to nbaPlayerHeadshots.json
 *
 * Prerequisites:
 * 1. Update serviceAccountKey.json to point to your development Firestore
 * 2. Ensure development Firestore has headshotURL populated for players
 *
 * Output format:
 * {
 *   "balldontlie_player_id": "https://cdn.nba.com/headshots/nba/latest/1040x760/1631165.png",
 *   ...
 * }
 */

async function exportHeadshotsFromFirestore() {
  console.log("📥 Fetching players from Firestore...\n");

  try {
    const playersSnapshot = await db.collection("nbaPlayers").get();

    if (playersSnapshot.empty) {
      console.log("⚠️  No players found in Firestore nbaPlayers collection");
      return;
    }

    const headshotMap = {};
    const stats = {
      total: 0,
      withHeadshots: 0,
      withoutHeadshots: 0,
    };

    playersSnapshot.forEach((doc) => {
      const player = doc.data();
      const playerId = player.playerId; // BallDontLie player ID
      const headshotURL = player.headshotURL || "";

      if (!playerId) {
        console.warn(`⚠️  Player missing playerId:`, player);
        return;
      }

      headshotMap[playerId] = headshotURL;

      stats.total++;
      if (headshotURL && headshotURL.trim() !== "") {
        stats.withHeadshots++;
        console.log(`✅ ${player.firstName} ${player.lastName} (ID: ${playerId})`);
      } else {
        stats.withoutHeadshots++;
        console.log(`⏳ ${player.firstName} ${player.lastName} (ID: ${playerId}) - no headshot`);
      }
    });

    // Create data directory if it doesn't exist
    if (!existsSync("./data")) {
      mkdirSync("./data", { recursive: true });
    }

    // Write to JSON file
    writeFileSync(
      "./data/nbaPlayerHeadshots.json",
      JSON.stringify(headshotMap, null, 2),
      "utf8"
    );

    // Also create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(
      `./data/nbaPlayerHeadshots.backup.${timestamp}.json`,
      JSON.stringify(headshotMap, null, 2),
      "utf8"
    );

    console.log("\n" + "=".repeat(70));
    console.log("✅ Headshots exported successfully!");
    console.log("=".repeat(70));
    console.log(`📁 Main file: ./data/nbaPlayerHeadshots.json`);
    console.log(`📁 Backup: ./data/nbaPlayerHeadshots.backup.${timestamp}.json`);
    console.log(`\n📊 Statistics:`);
    console.log(`   Total players: ${stats.total}`);
    console.log(`   With headshots: ${stats.withHeadshots} (${((stats.withHeadshots / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   Without headshots: ${stats.withoutHeadshots} (${((stats.withoutHeadshots / stats.total) * 100).toFixed(1)}%)`);
    console.log("=".repeat(70));

    // Show sample of exported data
    const sampleEntries = Object.entries(headshotMap).slice(0, 3);
    console.log("\n📝 Sample entries:");
    sampleEntries.forEach(([playerId, url]) => {
      console.log(`   "${playerId}": "${url}"`);
    });

    if (stats.withoutHeadshots > 0) {
      console.log(`\n💡 Tip: ${stats.withoutHeadshots} players don't have headshots in Firestore.`);
      console.log("   You can add them manually or use the other scripts to populate them.");
    }

  } catch (error) {
    console.error("❌ Error exporting headshots:", error);
    throw error;
  }
}

// Run the export
exportHeadshotsFromFirestore()
  .then(() => {
    console.log("\n✅ Export complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Export failed:", error);
    process.exit(1);
  });
