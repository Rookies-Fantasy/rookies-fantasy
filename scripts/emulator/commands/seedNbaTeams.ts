import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { DEFAULT_NBA_TEAMS } from "../data/nbaTeams.js";
import { seedNbaTeams } from "../fixtures/nbaTeams.js";

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const teams = await seedNbaTeams(db, DEFAULT_NBA_TEAMS);
  console.log(`Injected ${teams.length} NBA teams`);
};
