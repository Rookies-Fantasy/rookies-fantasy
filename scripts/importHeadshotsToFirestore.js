import { db } from "./firebaseConfig.js";
import { readFileSync } from "fs";

/**
 * Imports headshot URLs from nbaPlayerHeadshots.json into Firestore
 *
 * Prerequisites:
 * 1. Run exportHeadshotsFromFirestore.js on dev database first
 * 2. Update serviceAccountKey.json to point to target Firestore (staging/production)
 * 3. Ensure nbaPlayerHeadshots.json exists in ./data directory
 *
 * This script updates the headshotURL field for players in the nbaPlayers collection
 */

async function importHeadshotsToFirestore() {
  console.log("📥 Loading headshot data from JSON file...\n");

  let headshotMap;
  try {
    const fileContent = readFileSync("./data/nbaPlayerHeadshots.json", "utf8");
    headshotMap = JSON.parse(fileContent);
  } catch (error) {
    console.error("❌ Error reading nbaPlayerHeadshots.json:", error.message);
    console.log("\n💡 Make sure you've run exportHeadshotsFromFirestore.js first!");
    process.exit(1);
  }

  const totalPlayers = Object.keys(headshotMap).length;
  console.log(`📊 Found ${totalPlayers} players in JSON file\n`);

  const BATCH_SIZE = 500; // Firestore batch limit
  const stats = {
    updated: 0,
    notFound: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all players from Firestore
    const playersSnapshot = await db.collection("nbaPlayers").get();

    if (playersSnapshot.empty) {
      console.log("⚠️  No players found in Firestore nbaPlayers collection");
      return;
    }

    // Group updates into batches
    let batch = db.batch();
    let batchCount = 0;
    let operationCount = 0;

    console.log("🔄 Updating players in Firestore...\n");

    for (const doc of playersSnapshot.docs) {
      const player = doc.data();
      const playerId = player.playerId;

      if (!playerId) {
        console.warn(`⚠️  Player ${doc.id} missing playerId, skipping`);
        stats.skipped++;
        continue;
      }

      // Check if we have a headshot URL for this player
      if (headshotMap.hasOwnProperty(playerId)) {
        const headshotURL = headshotMap[playerId];

        // Update the document
        batch.update(doc.ref, {
          headshotURL: headshotURL,
        });

        operationCount++;
        stats.updated++;

        const name = `${player.firstName} ${player.lastName}`;
        if (headshotURL && headshotURL.trim() !== "") {
          console.log(`✅ Updated: ${name} (ID: ${playerId})`);
        } else {
          console.log(`⏳ Cleared: ${name} (ID: ${playerId}) - no headshot in source`);
        }

        // Commit batch if we've reached the limit
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          batchCount++;
          console.log(`\n📦 Committed batch ${batchCount} (${operationCount} operations)\n`);

          // Start a new batch
          batch = db.batch();
          operationCount = 0;
        }
      } else {
        stats.notFound++;
        console.log(`❓ Player ${player.firstName} ${player.lastName} (ID: ${playerId}) not in JSON file`);
      }
    }

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      batchCount++;
      console.log(`\n📦 Committed final batch ${batchCount} (${operationCount} operations)\n`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ Import completed!");
    console.log("=".repeat(70));
    console.log(`📊 Statistics:`);
    console.log(`   Total in JSON: ${totalPlayers}`);
    console.log(`   Updated in Firestore: ${stats.updated}`);
    console.log(`   Not found in Firestore: ${stats.notFound}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Batches committed: ${batchCount}`);
    console.log("=".repeat(70));

  } catch (error) {
    console.error("❌ Error importing headshots:", error);
    throw error;
  }
}

// Run the import
importHeadshotsToFirestore()
  .then(() => {
    console.log("\n✅ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
