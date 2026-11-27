import { db } from "./firebaseConfig.js";

async function updatePlayerTeamAbbreviations() {
  try {
    const teamSnapshot = await db.collection("nbaTeams").get();
    let teamMap = new Map();

    teamSnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.id && data.abbreviation) {
        teamMap.set(data.id, data.abbreviation);
      }
    });

    console.log(`Loaded ${teamMap.size} teams.`);

    const playersRef = db.collection("nbaPlayers");
    const batchSize = 500;
    let lastDoc = null;
    let totalUpdated = 0;

    while (true) {
      let query = playersRef.orderBy("teamId").limit(batchSize);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) break;

      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const abbreviation = teamMap.get(data.teamId);

        if (abbreviation) {
          const docRef = playersRef.doc(doc.id);
          batch.update(docRef, { teamAbbreviation: abbreviation });
        }
      });

      await batch.commit();
      totalUpdated += snapshot.size;
      console.log(`Updated ${totalUpdated} players so far...`);

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`Finished updating ${totalUpdated} players.`);
  } catch (error) {
    console.error("Error updating player documents:", error);
  }
}

updatePlayerTeamAbbreviations();
