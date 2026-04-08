import { spawn } from "child_process";
import * as path from "path";
import * as url from "url";
import { initEmulatorClient } from "./client.js";
import { run as runScenario } from "./scripts/injectScenario.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "../../server");
const READY_SIGNAL = "All emulators ready!";

const startEmulators = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn("firebase", ["emulators:start"], {
      cwd: SERVER_DIR,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let resolved = false;

    const onReady = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    proc.stdout.on("data", (chunk: Buffer) => {
      const line = chunk.toString();
      process.stdout.write(line);
      if (line.includes(READY_SIGNAL)) {
        onReady();
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
    });

    proc.on("error", (err) => {
      if (!resolved) reject(err);
    });

    proc.on("exit", (code) => {
      if (!resolved) {
        reject(new Error(`Emulators exited unexpectedly with code ${code}`));
      }
    });

  });
}

const main = async (): Promise<void> => {
  console.log("Starting Firebase emulators...\n");

  await startEmulators();

  console.log("\nEmulators ready. Injecting scenario...\n");

  const { db, auth } = initEmulatorClient();
  await runScenario(db, auth);

  console.log("\nDone. Emulator UI: http://localhost:4000");
  console.log("Press Ctrl+C to stop the emulators.\n");

  // Keep the process alive so emulators stay running
  await new Promise<void>(() => {});
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nError: ${message}`);
  process.exit(1);
});
