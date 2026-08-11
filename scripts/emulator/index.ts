import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { clearAll } from "./clear.js";
import { initEmulatorClient } from "./client.js";

type ScriptName =
  | "clear"
  | "user"
  | "team"
  | "matchup"
  | "end-matchup"
  | "scenario"
  | "nba-players"
  | "nba-teams"
  | "simulate-day"
  | "simulate-week";

type ScriptModule = {
  run(db: Firestore, auth: Auth): Promise<void>;
};

const SCRIPTS: Record<ScriptName, () => Promise<ScriptModule>> = {
  clear: async () => ({ run: clearAll }),
  user: () => import("./scripts/injectUser.js"),
  team: () => import("./scripts/injectTeam.js"),
  matchup: () => import("./scripts/injectMatchup.js"),
  "end-matchup": () => import("./scripts/endMatchup.js"),
  scenario: () => import("./scripts/injectScenario.js"),
  "nba-players": () => import("./scripts/injectNbaPlayers.js"),
  "nba-teams": () => import("./scripts/injectNbaTeams.js"),
  "simulate-day": () => import("./scripts/simulateDay.js"),
  "simulate-week": () => import("./scripts/simulateWeek.js"),
};

const main = async (): Promise<void> => {
  const scriptName = process.argv[2] as ScriptName | undefined;

  if (!scriptName) {
    console.log("Usage: tsx emulator/index.ts <script>");
    console.log("Scripts:", Object.keys(SCRIPTS).join(", "));
    process.exit(1);
  }

  const loader = SCRIPTS[scriptName];
  if (!loader) {
    throw new Error(`Unknown script: ${scriptName}`);
  }

  const { db, auth } = initEmulatorClient();
  const mod = await loader();
  await mod.run(db, auth);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
