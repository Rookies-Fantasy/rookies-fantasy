import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { NBA_PLAYERS } from "../data/nbaPlayers.js";

export async function run(db: Firestore, _auth: Auth): Promise<void> {
  const batch = db.batch();

  for (const player of NBA_PLAYERS) {
    const ref = db.collection("nbaPlayers").doc(player.playerId);
    batch.set(ref, player);
  }

  await batch.commit();
  console.log(`Injected ${NBA_PLAYERS.length} NBA players`);
}
