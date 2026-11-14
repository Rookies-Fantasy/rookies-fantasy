import { PROJECT_ID } from "../../emulator/core/client.js";

export { PROJECT_ID };

export const HOST = "127.0.0.1";
export const REGION = "us-central1";

// The default ports from server/firebase.json. They are fixed on purpose: the
// skill refuses to launch when any of them is taken instead of moving aside.
export const PORTS = {
  ui: 4000,
  hub: 4400,
  logging: 4500,
  functions: 5001,
  firestore: 8080,
  auth: 9099,
  firestoreWebSocket: 9150,
} as const;

export const SEED_PASSWORD = "password123";

export const SEED_ACCOUNTS = {
  user: "dev@test.com",
  opponent: "opponent@test.com",
  memberOne: "league1@test.com",
  memberTwo: "league2@test.com",
} as const;

export const SEED_USER_TEAM_ID = "default-team";

export const EXPECTED_FUNCTIONS = [
  "createLeague",
  "joinLeague",
  "getLeagueStandings",
] as const;

export const READY_TIMEOUT_MS = 180_000;
export const STOP_TIMEOUT_MS = 30_000;
