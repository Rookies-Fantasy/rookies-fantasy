import { db } from "./firebaseConfig.js";

const getAverageStats = async () => {
  const snapshot = await db.collection("nbaPlayers").get();

  let players = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    const docRef = doc.ref;
    const playerId = data.id;
    const averageStats = data.averageStats || {};
    const gamesPlayed = data.gamesPlayed || 0;

    players.push({
      docRef,
      id: playerId,
      averageStats,
      gamesPlayed,
    });
  });

  return players;
};

const calculateFPTS = (raw) => {
  return (
    raw.points +
    raw.rebounds +
    raw.assists * 2 +
    raw.steals * 4 +
    raw.blocks * 4 +
    raw.fieldGoalsMade * 2 +
    raw.freeThrowsMade +
    raw.threePointersMade -
    raw.turnovers * 2 -
    raw.fieldGoalsAttempted -
    raw.freeThrowsAttempted
  );
};

const updateFPTS = async (players) => {
  const BATCH_SIZE = 500;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = db.batch();

    const chunk = players.slice(i, i + BATCH_SIZE);

    chunk.forEach((player) => {
      const fpts = calculateFPTS(player.averageStats);
      batch.update(player.docRef, {
        "averageStats.fantasyPoints": parseFloat(fpts.toFixed(1)),
      });
    });

    await batch.commit();
    console.log(i);

    console.log(`Batch ${i / BATCH_SIZE + 1} committed`);
  }

  console.log("All fantasy points updated.");
};

const main = async () => {
  const players = await getAverageStats();
  await updateFPTS(players);
};

main().catch((err) => console.error("Error updating FPTS:", err));
