import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Export player positions from production Firestore to JSON file
 */
const exportPositionsFromFirestore = async () => {
  console.log("Connecting to Production Firestore...");

  // Read and parse service account
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  const serviceAccountJSON = await readFile(serviceAccountPath, "utf-8");
  const serviceAccount = JSON.parse(serviceAccountJSON);

  // Initialize Firebase Admin with production credentials
  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  console.log("Fetching players from nbaPlayers collection...");

  // Fetch all players from the collection
  const playersSnapshot = await db.collection("nbaPlayers").get();

  console.log(`Found ${playersSnapshot.size} players`);

  // Create positions mapping object
  const positionsData = {};

  playersSnapshot.forEach((doc) => {
    const player = doc.data();
    const playerId = player.playerId;
    const positions = player.positions;

    if (playerId && positions && Array.isArray(positions)) {
      positionsData[playerId] = positions;
    } else {
      console.warn(`⚠️  Player ${playerId} missing positions data`);
    }
  });

  // Write to file
  const positionsPath = path.join(__dirname, "data", "nbaPlayerPositions.json");
  await writeFile(
    positionsPath,
    JSON.stringify(positionsData, null, 2),
    "utf8"
  );

  console.log("");
  console.log(
    `✓ Exported positions for ${Object.keys(positionsData).length} players`
  );
  console.log(`✓ File saved to: ${positionsPath}`);
  console.log("");
  console.log("You can now use this file in your migration scripts!");

  process.exit(0);
};

exportPositionsFromFirestore().catch((error) => {
  console.error("Error exporting positions:", error);
  process.exit(1);
});
