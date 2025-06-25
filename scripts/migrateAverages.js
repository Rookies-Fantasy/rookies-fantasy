import { db } from "./firebaseConfig.js";

async function denormalizePlayerAverages() {
  const averagesSnapshot = await db.collection("nbaPlayerAverages").get();

  console.log(`Found ${averagesSnapshot.size} average documents.`);

  let batch = db.batch();
  let batchCounter = 0;

  for (const doc of averagesSnapshot.docs) {
    const averageData = doc.data();
    const { playerId, gamesPlayed, averageStats } = averageData;

    const playerQuerySnapshot = await db
      .collection("nbaPlayers")
      .where("playerId", "==", playerId)
      .limit(1)
      .get();

    if (playerQuerySnapshot.empty) {
      console.warn(`Player with playerId ${playerId} not found in nbaPlayers.`);
      continue;
    }

    const playerDoc = playerQuerySnapshot.docs[0];
    const playerRef = playerDoc.ref;
    const playerData = playerDoc.data();

    if (playerData.averageStats) {
      console.log(`Skipping player ${playerId} (already has averageStats).`);
      continue;
    }

    batch.update(playerRef, {
      gamesPlayed,
      averageStats,
    });

    batchCounter++;

    if (batchCounter >= 500) {
      await batch.commit();
      console.log(`Committed batch of 500 updates.`);
      batch = db.batch();
      batchCounter = 0;
    }
  }

  if (batchCounter > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${batchCounter} updates.`);
  }

  console.log("Denormalization complete.");
}

denormalizePlayerAverages().catch(console.error);
