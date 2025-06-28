import { db } from "./firebaseConfig.js";
import { readFileSync } from "fs";

const playersArray = JSON.parse(
  readFileSync("./data/nbaPlayerHeadshots.json", "utf8")
);

async function updatePlayersInBatches(players) {
  const BATCH_SIZE = 500;
  let batchCount = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = players.slice(i, i + BATCH_SIZE);

    for (const player of chunk) {
      const { first_name, last_name, headshot_url } = player;

      const snapshot = await db
        .collection("nbaPlayers")
        .where("firstName", "==", first_name)
        .where("lastName", "==", last_name)
        .get();

      if (snapshot.empty) {
        console.warn(`Player not found: ${first_name} ${last_name}`);
        continue;
      }

      snapshot.forEach((doc) => {
        const ref = doc.ref;

        batch.update(ref, {
          headshotURL: headshot_url,
          firstName: first_name,
          lastName: last_name,
        });
      });
    }

    await batch.commit();
    console.log(`Batch ${++batchCount} committed with ${chunk.length} players`);
  }

  console.log("All batches completed!");
}

updatePlayersInBatches(playersArray).catch((err) => {
  console.error("Error updating players:", err);
});
