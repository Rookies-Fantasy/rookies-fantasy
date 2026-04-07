import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { initEmulatorClient } from "./client.js";
import { clearAll } from "./clear.js";

type ScriptName =
  | "clear"
  | "user"
  | "team"
  | "matchup"
  | "nba-players"
  | "nba-teams";

type ScriptModule = {
  run(db: Firestore, auth: Auth): Promise<void>;
};

type ScriptEntry = {
  name: ScriptName;
  description: string;
  load: () => Promise<ScriptModule>;
};

const SCRIPTS: ScriptEntry[] = [
  {
    name: "clear",
    description: "Wipe all Firestore collections and Auth users from the emulator",
    load: () =>
      Promise.resolve({
        run: (db, auth) => clearAll(db, auth),
      }),
  },
  {
    name: "user",
    description:
      "Inject a mock user into Auth emulator + users collection. Env: USER_EMAIL, USER_PASSWORD",
    load: () => import("./scripts/injectUser.js"),
  },
  {
    name: "team",
    description:
      "Inject a mock team for an existing user. Env: USER_ID (required)",
    load: () => import("./scripts/injectTeam.js"),
  },
  {
    name: "matchup",
    description:
      "Inject a mock matchup between two existing users/teams. Env: HOME_USER_ID, HOME_TEAM_ID, AWAY_USER_ID, AWAY_TEAM_ID (all required)",
    load: () => import("./scripts/injectMatchup.js"),
  },
  {
    name: "nba-players",
    description: "Batch-inject NBA players from data/nbaPlayers.ts into the nbaPlayers collection",
    load: () => import("./scripts/injectNbaPlayers.js"),
  },
  {
    name: "nba-teams",
    description: "Batch-inject NBA teams from data/nbaTeams.ts into the nbaTeams collection",
    load: () => import("./scripts/injectNbaTeams.js"),
  },
];

function printList(): void {
  console.log("\nAvailable seed scripts:\n");
  const nameWidth = Math.max(...SCRIPTS.map((s) => s.name.length)) + 2;
  for (const script of SCRIPTS) {
    console.log(`  ${script.name.padEnd(nameWidth)}${script.description}`);
  }
  console.log(
    "\nUsage: npm run seed:<name>  (e.g. npm run seed:user)\n" +
      "       npm run seed:list     (show this list)\n"
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--list") || args.includes("list")) {
    printList();
    process.exit(0);
  }

  const scriptName = args[0] as ScriptName | undefined;

  if (!scriptName) {
    console.error("Error: no script specified.\n");
    printList();
    process.exit(1);
  }

  const entry = SCRIPTS.find((s) => s.name === scriptName);
  if (!entry) {
    console.error(`Error: unknown script "${scriptName}".\n`);
    printList();
    process.exit(1);
  }

  const { db, auth } = initEmulatorClient();

  console.log(`Running: ${scriptName}\n`);

  const mod = await entry.load();
  await mod.run(db, auth);

  console.log(`\nDone. Emulator UI: http://localhost:4000`);
  process.exit(0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nError: ${message}`);
  process.exit(1);
});
