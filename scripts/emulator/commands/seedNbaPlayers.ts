import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { DEFAULT_NBA_PLAYERS } from "../data/nbaPlayers.js";
import { seedNbaPlayers } from "../fixtures/nbaPlayers.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const players = await seedNbaPlayers(db, DEFAULT_NBA_PLAYERS);
  console.log(`Injected ${players.length} NBA players`);
};
