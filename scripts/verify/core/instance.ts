import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { HOST, PORTS, PROJECT_ID } from "./config.js";
import { getField, getNumber, getString, parseJsonText } from "./json.js";
import { INSTANCE_FILE, RUNS_DIR } from "./paths.js";

// What launch records about the emulators it started. Doctor and cleanup only
// ever act on the process named here.
export type InstanceState = {
  pid: number;
  launchedAt: string;
  branch: string;
  commit: string;
  functionsSourceHash: string;
  launchDir: string;
  logPath: string;
};

export const readInstance = (): InstanceState | null => {
  if (!fs.existsSync(INSTANCE_FILE)) {
    return null;
  }

  const data = parseJsonText(fs.readFileSync(INSTANCE_FILE, "utf8"));
  const pid = getNumber(data, "pid");

  if (pid === null) {
    return null;
  }

  return {
    pid,
    launchedAt: getString(data, "launchedAt"),
    branch: getString(data, "branch"),
    commit: getString(data, "commit"),
    functionsSourceHash: getString(data, "functionsSourceHash"),
    launchDir: getString(data, "launchDir"),
    logPath: getString(data, "logPath"),
  };
};

export const writeInstance = (state: InstanceState): void => {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  fs.writeFileSync(INSTANCE_FILE, `${JSON.stringify(state, null, 2)}\n`);
};

export const removeInstance = (): void => {
  fs.rmSync(INSTANCE_FILE, { force: true });
};

export const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else.
    return error instanceof Error && "code" in error && error.code === "EPERM";
  }
};

export const isPortOpen = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.connect({ host: HOST, port });
    const finish = (open: boolean): void => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

export type PortStatus = { name: string; port: number; open: boolean };

export const checkPorts = async (): Promise<PortStatus[]> =>
  Promise.all(
    Object.entries(PORTS).map(async ([name, port]) => ({
      name,
      port,
      open: await isPortOpen(port),
    })),
  );

// The Firebase CLI writes this file when its emulator hub starts, with the PID
// of the CLI process. Matching it to the PID launch spawned proves the
// listening emulators are this skill's, not a copy started elsewhere.
export const readHubPid = (): number | null => {
  const locator = path.join(os.tmpdir(), `hub-${PROJECT_ID}.json`);

  if (!fs.existsSync(locator)) {
    return null;
  }

  return getNumber(parseJsonText(fs.readFileSync(locator, "utf8")), "pid");
};

export type HubEmulator = { name: string; port: number | null };

export const readHubEmulators = async (): Promise<HubEmulator[] | null> => {
  try {
    const response = await fetch(`http://${HOST}:${PORTS.hub}/emulators`);
    if (!response.ok) {
      return null;
    }

    const body = parseJsonText(await response.text());
    return ["auth", "firestore", "functions"].map((name) => ({
      name,
      port: getNumber(getField(body, name), "port"),
    }));
  } catch {
    return null;
  }
};
