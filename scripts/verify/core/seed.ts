import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { clearAll } from "../../emulator/core/reset.js";
import {
  type LeagueReadyScenarioResult,
  createLeagueReadyScenario,
} from "../../emulator/scenarios/leagueReady.js";
import { SEED_ACCOUNTS, SEED_PASSWORD, SEED_USER_TEAM_ID } from "./config.js";

// The baseline every drive starts from: empty emulators plus the same
// league-ready scenario that `npm run seed:league-ready` creates.
export const seedBaseline = async (
  db: Firestore,
  auth: Auth,
): Promise<LeagueReadyScenarioResult> => {
  await clearAll(db, auth);
  return createLeagueReadyScenario(db, auth, {
    userEmail: SEED_ACCOUNTS.user,
    opponentEmail: SEED_ACCOUNTS.opponent,
    memberEmails: [SEED_ACCOUNTS.memberOne, SEED_ACCOUNTS.memberTwo],
    password: SEED_PASSWORD,
    userTeamId: SEED_USER_TEAM_ID,
  });
};
