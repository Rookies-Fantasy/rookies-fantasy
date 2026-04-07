import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { NBA_TEAMS } from "../data/nbaTeams.js";

export async function run(db: Firestore, _auth: Auth): Promise<void> {
  const batch = db.batch();

  for (const team of NBA_TEAMS) {
    const ref = db.collection("nbaTeams").doc(team.id);
    batch.set(ref, team);
  }

  await batch.commit();
  console.log(`Injected ${NBA_TEAMS.length} NBA teams`);
}
