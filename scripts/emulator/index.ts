import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { initEmulatorClient } from "./core/client.js";
import { clearAll } from "./core/reset.js";

type CommandName =
  | "clear"
  | "user"
  | "team"
  | "matchup"
  | "end-matchup"
  | "scenario"
  | "draft-ready"
  | "queue-ready"
  | "queue-opponent"
  | "nba-players"
  | "nba-teams"
  | "simulate-day"
  | "simulate-week";

type CommandModule = {
  run(db: Firestore, auth: Auth): Promise<void>;
};

const COMMANDS: Record<CommandName, () => Promise<CommandModule>> = {
  clear: async () => ({ run: clearAll }),
  user: () => import("./commands/seedUser.js"),
  team: () => import("./commands/seedTeam.js"),
  matchup: () => import("./commands/seedMatchup.js"),
  "end-matchup": () => import("./commands/endMatchup.js"),
  scenario: () => import("./commands/seedScenario.js"),
  "draft-ready": () => import("./commands/seedDraftReady.js"),
  "queue-ready": () => import("./commands/seedQueueReady.js"),
  "queue-opponent": () => import("./commands/queueOpponent.js"),
  "nba-players": () => import("./commands/seedNbaPlayers.js"),
  "nba-teams": () => import("./commands/seedNbaTeams.js"),
  "simulate-day": () => import("./commands/simulateDay.js"),
  "simulate-week": () => import("./commands/simulateWeek.js"),
};

const main = async (): Promise<void> => {
  const commandName = process.argv[2] as CommandName | undefined;

  if (!commandName) {
    console.log("Usage: tsx emulator/index.ts <command>");
    console.log("Commands:", Object.keys(COMMANDS).join(", "));
    process.exit(1);
  }

  const loader = COMMANDS[commandName];
  if (!loader) {
    throw new Error(`Unknown command: ${commandName}`);
  }

  const { db, auth } = initEmulatorClient();
  const mod = await loader();
  await mod.run(db, auth);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
