import { spawnSync } from "node:child_process";
import { STOP_TIMEOUT_MS } from "../core/config.js";
import {
  checkPorts,
  isProcessAlive,
  readInstance,
  removeInstance,
} from "../core/instance.js";
import { RUNS_DIR, relativeToRepo } from "../core/paths.js";

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Stops the process tree launch recorded, and nothing else: never by process
// name, never another instance that happens to hold the same ports.
const stopTree = (pid: number): void => {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      encoding: "utf8",
    });
    return;
  }

  try {
    process.kill(-pid, "SIGINT");
  } catch {
    process.kill(pid, "SIGINT");
  }
};

export const run = async (): Promise<number> => {
  const instance = readInstance();

  if (instance === null) {
    console.log(
      "Nothing to clean up: no emulators launched by this skill are recorded.",
    );
    return 0;
  }

  if (isProcessAlive(instance.pid)) {
    console.log(`Stopping the emulators (PID ${instance.pid})...`);
    stopTree(instance.pid);
  }

  const deadline = Date.now() + STOP_TIMEOUT_MS;
  let stillOpen = (await checkPorts()).filter((status) => status.open);

  while (
    (isProcessAlive(instance.pid) || stillOpen.length > 0) &&
    Date.now() < deadline
  ) {
    await wait(1000);
    stillOpen = (await checkPorts()).filter((status) => status.open);
  }

  if (isProcessAlive(instance.pid)) {
    console.error(
      `PID ${instance.pid} is still running after ${STOP_TIMEOUT_MS / 1000}s; the record is kept so cleanup can be retried.`,
    );
    return 1;
  }

  removeInstance();

  if (stillOpen.length > 0) {
    console.log(
      `Stopped PID ${instance.pid}, but these ports are still in use by something else: ${stillOpen
        .map((status) => `${status.name} ${status.port}`)
        .join(", ")}.`,
    );
  } else {
    console.log(`Stopped PID ${instance.pid}; all emulator ports are free.`);
  }

  console.log(`Evidence is kept in ${relativeToRepo(RUNS_DIR)}/.`);
  return 0;
};
