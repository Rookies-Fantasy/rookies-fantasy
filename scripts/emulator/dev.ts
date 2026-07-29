import { spawn } from "child_process";
import * as path from "path";
import * as url from "url";
import { initEmulatorClient } from "./client.js";
import { run as runScenario } from "./scripts/injectScenario.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "../../server");

const startEmulators = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn("firebase", ["emulators:start"], {
      cwd: SERVER_DIR,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout.on("data", (chunk: Buffer) => {
      const line = chunk.toString();
      process.stdout.write(line);
      if (line.includes("All emulators ready!")) {
        resolve();
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => process.stderr.write(chunk));
    proc.on("error", reject);
  });

const main = async (): Promise<void> => {
  console.log("Starting Firebase emulators...");
  await startEmulators();

  const { db, auth } = initEmulatorClient();
  await runScenario(db, auth);

  console.log("Emulator ready. Press Ctrl+C to stop.");
  await new Promise<void>(() => {});
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
