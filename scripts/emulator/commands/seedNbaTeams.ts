import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

const TEAMS = [
  { id: "lal", name: "Los Angeles Lakers", abbreviation: "LAL" },
  { id: "mil", name: "Milwaukee Bucks", abbreviation: "MIL" },
];

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const batch = db.batch();
  for (const team of TEAMS) {
    batch.set(db.collection("nbaTeams").doc(team.id), team);
  }
  await batch.commit();
  console.log(`Injected ${TEAMS.length} NBA teams`);
};
