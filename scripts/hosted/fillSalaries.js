import { db } from "./firebaseConfig.js";
import { FieldValue } from "firebase-admin/firestore";

const BATCH_SIZE = 500;

const getSalaries = async () => {
  const snapshot = await db.collection("nbaPlayers").get();

  let players = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    const docRef = doc.ref;
    const playerId = data.id;
    const fantasyPoints = data.averageStats.fantasyPoints || 0;

    players.push({
      docRef,
      id: playerId,
      fantasyPoints,
    });
  });

  return players;
};

function linearScale(actualFpts, minFpts, maxFpts, minSalary, maxSalary) {
  return (
    (minSalary +
      ((actualFpts - minFpts) * (maxSalary - minSalary)) /
        (maxFpts - minFpts)) *
    1000000
  );
}

function roundToHundredThousand(value) {
  return Math.round(value / 100000) * 100000;
}

// EX: Nikola Jovic 22.6 FPTS
// linScale func
// salary = (10 + ((22.6 - 15) * (15 - 10)) / (25 - 15) * 1000000)
// salary = 13 820 000

function calculateSalary(fpts) {
  if (fpts === undefined || fpts === null || isNaN(fpts) || fpts < 0) return 1;

  if (fpts >= 50) return (35 + (fpts - 50) * 0.67) * 1000000;
  else if (fpts >= 35 && fpts < 50) return linearScale(fpts, 35, 50, 25, 35);
  else if (fpts >= 25 && fpts < 35) return linearScale(fpts, 25, 35, 15, 25);
  else if (fpts >= 15 && fpts < 25) return linearScale(fpts, 15, 25, 10, 15);
  else if (fpts >= 5 && fpts < 15) return linearScale(fpts, 5, 15, 5, 10);
  else return linearScale(fpts, 0, 5, 1, 5);
}

const updateSalaries = async (players) => {
  const BATCH_SIZE = 500;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = db.batch();

    const chunk = players.slice(i, i + BATCH_SIZE);

    chunk.forEach((player) => {
      const salary = calculateSalary(player.fantasyPoints);
      const roundedSalary = roundToHundredThousand(salary);
      batch.update(player.docRef, {
        salary: roundedSalary,
      });
    });

    await batch.commit();
    console.log(i);

    console.log(`Batch ${i / BATCH_SIZE + 1} committed`);
  }

  console.log("All salaries updated.");
};

const main = async () => {
  const players = await getSalaries();
  await updateSalaries(players);
};

main().catch((err) => console.error("Error updating FPTS:", err));
