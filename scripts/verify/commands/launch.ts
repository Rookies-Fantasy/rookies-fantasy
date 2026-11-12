import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { initEmulatorClient } from "../../emulator/core/client.js";
import { PROJECT_ID, READY_TIMEOUT_MS } from "../core/config.js";
import { createRunDir, describeDir } from "../core/evidence.js";
import { readGitState } from "../core/git.js";
import {
  checkPorts,
  isProcessAlive,
  readHubEmulators,
  readHubPid,
  readInstance,
  removeInstance,
  writeInstance,
} from "../core/instance.js";
import { FUNCTIONS_DIR, SERVER_DIR } from "../core/paths.js";
import { printChecks } from "../core/report.js";
import { seedBaseline } from "../core/seed.js";
import { runDoctor } from "./doctor.js";

const IS_WINDOWS = process.platform === "win32";

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const tail = (file: string, lines: number): string =>
  fs.readFileSync(file, "utf8").split("\n").slice(-lines).join("\n");

type NpmResult = { status: number | null; stdout: string; stderr: string };

// On Windows npm is npm.cmd, which only runs through a shell, and a shell
// takes one quoted command string rather than an argument list.
const runNpm = (args: string[], env: NodeJS.ProcessEnv): NpmResult => {
  const result = IS_WINDOWS
    ? spawnSync(["npm", ...args.map((arg) => `"${arg}"`)].join(" "), {
        encoding: "utf8",
        shell: true,
        env,
      })
    : spawnSync("npm", args, { encoding: "utf8", env });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

// Spawning the CLI's script with this Node binary, rather than through a
// shell, makes the recorded PID the Firebase CLI itself: the same PID the
// emulator hub reports, and the root of everything cleanup has to stop.
const resolveFirebaseCli = (): string => {
  // `npm --prefix scripts run verify` sets npm_config_prefix, which would point
  // `npm root -g` at scripts/ instead of the global install.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => key.toLowerCase() !== "npm_config_prefix",
    ),
  );
  const result = runNpm(["root", "-g"], env);
  const cli = path.join(
    result.stdout.trim(),
    "firebase-tools",
    "lib",
    "bin",
    "firebase.js",
  );

  if (!fs.existsSync(cli)) {
    throw new Error(
      `Firebase CLI not found at ${cli}. Install it with \`npm install -g firebase-tools\`.`,
    );
  }

  return cli;
};

const buildFunctions = (logPath: string): void => {
  const result = runNpm(
    ["--prefix", FUNCTIONS_DIR, "run", "build"],
    process.env,
  );
  fs.appendFileSync(
    logPath,
    `$ npm --prefix server/functions run build\n${result.stdout}${result.stderr}\n`,
  );

  if (result.status !== 0) {
    throw new Error(`Functions build failed; see ${logPath}`);
  }
};

const waitForReady = async (pid: number, logPath: string): Promise<void> => {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (!isProcessAlive(pid)) {
      throw new Error(
        `The emulators exited during startup. Last log lines:\n${tail(logPath, 20)}`,
      );
    }

    const emulators = await readHubEmulators();
    const allUp =
      emulators !== null &&
      emulators.every((emulator) => emulator.port !== null);
    const logReady = fs
      .readFileSync(logPath, "utf8")
      .includes("All emulators ready");

    if (allUp && logReady && readHubPid() === pid) {
      return;
    }

    await wait(1000);
  }

  throw new Error(
    `The emulators were not ready after ${READY_TIMEOUT_MS / 1000}s. Last log lines:\n${tail(logPath, 20)}`,
  );
};

export const run = async (): Promise<number> => {
  const existing = readInstance();

  if (existing !== null) {
    if (isProcessAlive(existing.pid)) {
      console.error(
        `Emulators launched by this skill are already running (PID ${existing.pid}). Run \`doctor\` to check them or \`cleanup\` to stop them.`,
      );
      return 1;
    }

    console.log(`Removing the record of exited instance PID ${existing.pid}.`);
    removeInstance();
  }

  const busy = (await checkPorts()).filter((status) => status.open);

  if (busy.length > 0) {
    console.error(
      `Refusing to launch: ports already in use (${busy
        .map((status) => `${status.name} ${status.port}`)
        .join(", ")}).`,
    );
    console.error(
      "Another emulator instance is probably running, for example in a terminal. Stop it and run launch again. This skill never drives emulators it did not start.",
    );
    return 1;
  }

  const launchedAt = new Date();
  const git = readGitState();
  const launchDir = createRunDir(launchedAt, git.branch, "launch");
  const logPath = path.join(launchDir, "emulators.log");
  fs.writeFileSync(logPath, "");

  console.log(`Building Functions from ${git.commit.slice(0, 7)}...`);
  buildFunctions(logPath);

  const cli = resolveFirebaseCli();
  const out = fs.openSync(logPath, "a");
  const child = spawn(
    process.execPath,
    [cli, "emulators:start", "--project", PROJECT_ID],
    {
      cwd: SERVER_DIR,
      detached: true,
      stdio: ["ignore", out, out],
      windowsHide: true,
    },
  );
  child.unref();
  fs.closeSync(out);

  const pid = child.pid ?? 0;
  if (pid === 0) {
    throw new Error("The Firebase CLI did not start.");
  }

  console.log(
    `Started the emulators (PID ${pid}); waiting until they are ready...`,
  );

  const state = {
    pid,
    launchedAt: launchedAt.toISOString(),
    branch: git.branch,
    commit: git.commit,
    functionsSourceHash: git.functionsSourceHash,
    launchDir: describeDir(launchDir),
    logPath: describeDir(logPath),
  };
  // Recorded before waiting, so cleanup can stop a launch that never got ready.
  writeInstance(state);

  await waitForReady(pid, logPath);

  console.log("Seeding the league-ready baseline...");
  const { db, auth } = initEmulatorClient();
  await seedBaseline(db, auth);

  const checks = await runDoctor();
  printChecks("Doctor", checks);
  console.log(`\nEmulator log: ${state.logPath}`);

  return checks.every((check) => check.passed) ? 0 : 1;
};
