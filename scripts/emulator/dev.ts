import { execFile, spawn } from "node:child_process";
import { delimiter, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { PROJECT_ID } from "./core/client.js";

const SCRIPTS_DIR = fileURLToPath(new URL("..", import.meta.url));
const SERVER_DIR = resolve(SCRIPTS_DIR, "../server");
const CLIENT_DIR = resolve(SCRIPTS_DIR, "../client");

const getFirebaseEnvironment = async (): Promise<NodeJS.ProcessEnv> => {
  if (process.platform !== "win32") return process.env;

  // Oracle's Windows java.exe shim spawns another JVM, which can outlive CLI shutdown.
  // Use the runtime's real binary so Firebase owns and stops the actual emulator.
  const { stderr } = await promisify(execFile)(
    "java",
    ["-XshowSettings:properties", "-version"],
    { windowsHide: true },
  );
  const javaHome = stderr.match(/^\s*java\.home\s*=\s*(.+)$/m)?.[1].trim();
  if (!javaHome)
    throw new Error("Could not determine the Java runtime directory.");

  const pathKey =
    Object.keys(process.env).find((key) => key.toLowerCase() === "path") ??
    "PATH";
  return {
    ...process.env,
    [pathKey]: `${resolve(javaHome, "bin")}${delimiter}${process.env[pathKey] ?? ""}`,
  };
};

const setBackgroundTriggers = async (enabled: boolean): Promise<void> => {
  const action = enabled ? "enable" : "disable";
  const response = await fetch(
    `http://${process.env.FIREBASE_EMULATOR_HUB}/functions/${action}BackgroundTriggers`,
    { method: "PUT", signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) {
    throw new Error(
      `Could not ${action} emulator triggers: HTTP ${response.status}`,
    );
  }
};

// Commands are fixed strings; paths are passed as cwd rather than shell arguments.
const runCommand = (
  command: string,
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, {
      cwd,
      env,
      shell: true,
      stdio: "inherit",
      windowsHide: true,
    });

    proc.once("error", reject);
    proc.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}.`,
          ),
        );
      }
    });
  });

const main = async (): Promise<void> => {
  const mode = process.argv[2];
  if (process.argv.length > 3 || (mode !== undefined && mode !== "--app")) {
    throw new Error("Usage: npm run dev");
  }

  if (mode === "--app") {
    if (
      !process.env.FIREBASE_EMULATOR_HUB ||
      !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      !process.env.FIRESTORE_EMULATOR_HOST
    ) {
      throw new Error(
        "dev:app is started by Firebase. Use npm run dev instead.",
      );
    }

    console.log("Seeding the default matchup scenario...");
    // Auth creation triggers would otherwise overwrite the seeded user profiles.
    await setBackgroundTriggers(false);
    try {
      await runCommand("npm run seed:scenario", SCRIPTS_DIR);
    } finally {
      await setBackgroundTriggers(true);
    }

    console.log("Starting Expo. Press Ctrl+C to stop Expo and Firebase.");
    await runCommand("npm start -- --dev-client", CLIENT_DIR, {
      ...process.env,
      APP_ENV: "development",
      EXPO_PUBLIC_USE_EMULATOR: "true",
    });
    return;
  }

  console.log("Building Cloud Functions...");
  await runCommand("npm run build", resolve(SERVER_DIR, "functions"));

  console.log("Starting fresh Firebase emulators...");
  // Firebase runs dev:app after readiness and shuts down when it exits or fails.
  await runCommand(
    `firebase emulators:exec --project ${PROJECT_ID} --only auth,firestore,functions --ui "npm --prefix ../scripts run dev:app"`,
    SERVER_DIR,
    await getFirebaseEnvironment(),
  );
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
