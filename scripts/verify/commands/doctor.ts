import {
  EXPECTED_FUNCTIONS,
  PORTS,
  SEED_ACCOUNTS,
  SEED_PASSWORD,
} from "../core/config.js";
import { readGitState } from "../core/git.js";
import { SIGNED_OUT, callCallable, getFunction, signIn } from "../core/http.js";
import {
  isProcessAlive,
  readHubEmulators,
  readHubPid,
  readInstance,
} from "../core/instance.js";
import { type CheckResult, printChecks } from "../core/report.js";

const EXPECTED_PORTS: Record<string, number> = {
  auth: PORTS.auth,
  firestore: PORTS.firestore,
  functions: PORTS.functions,
};

// Every expected function requires sign-in, so a signed-out request that
// answers 401 proves the function is loaded without changing any data.
const probeFunction = async (name: string): Promise<CheckResult> => {
  try {
    const exchange =
      name === "getLeagueStandings"
        ? await getFunction(name, { leagueId: "doctor-probe" }, SIGNED_OUT)
        : await callCallable(name, {}, SIGNED_OUT);
    const status = exchange.response.status;
    return {
      name: `function ${name} loaded`,
      passed: status === 401,
      detail: `signed-out request answered ${status} (expected 401)`,
    };
  } catch (error) {
    return {
      name: `function ${name} loaded`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

// Read-only: answers "is this instance worth driving?" and changes nothing.
export const runDoctor = async (): Promise<CheckResult[]> => {
  const instance = readInstance();

  if (instance === null) {
    return [
      {
        name: "instance recorded",
        passed: false,
        detail:
          "no emulators launched by this skill; run `npm --prefix scripts run verify -- launch`",
      },
    ];
  }

  const checks: CheckResult[] = [
    {
      name: "instance recorded",
      passed: true,
      detail: `PID ${instance.pid}, launched ${instance.launchedAt}`,
    },
  ];

  const alive = isProcessAlive(instance.pid);
  checks.push({
    name: "process alive",
    passed: alive,
    detail: alive
      ? `PID ${instance.pid} is running`
      : `PID ${instance.pid} has exited; see ${instance.logPath}`,
  });

  if (!alive) {
    return checks;
  }

  const hubPid = readHubPid();
  checks.push({
    name: "emulators owned by this instance",
    passed: hubPid === instance.pid,
    detail:
      hubPid === instance.pid
        ? `emulator hub reports PID ${hubPid}`
        : `emulator hub reports PID ${hubPid === null ? "none" : hubPid}, expected ${instance.pid}`,
  });

  const emulators = await readHubEmulators();
  const listening =
    emulators !== null &&
    emulators.every(
      (emulator) => emulator.port === EXPECTED_PORTS[emulator.name],
    );
  checks.push({
    name: "emulators listening",
    passed: listening,
    detail:
      emulators === null
        ? `no answer from the emulator hub on port ${PORTS.hub}`
        : emulators
            .map(
              (emulator) =>
                `${emulator.name}:${emulator.port === null ? "missing" : emulator.port}`,
            )
            .join(", "),
  });

  if (!listening) {
    return checks;
  }

  for (const name of EXPECTED_FUNCTIONS) {
    checks.push(await probeFunction(name));
  }

  const git = readGitState();
  const buildMatches =
    git.commit === instance.commit &&
    git.functionsSourceHash === instance.functionsSourceHash;
  checks.push({
    name: "build matches checkout",
    passed: buildMatches,
    detail: buildMatches
      ? `functions built from ${git.commit.slice(0, 7)} (source ${git.functionsSourceHash})`
      : `built from ${instance.commit.slice(0, 7)} (source ${instance.functionsSourceHash}), checkout is ${git.commit.slice(0, 7)} (source ${git.functionsSourceHash}); run cleanup, then launch`,
  });

  try {
    await signIn(SEED_ACCOUNTS.user, SEED_PASSWORD);
    checks.push({
      name: "seeded account signs in",
      passed: true,
      detail: `${SEED_ACCOUNTS.user} signed in`,
    });
  } catch (error) {
    checks.push({
      name: "seeded account signs in",
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  return checks;
};

export const run = async (): Promise<number> => {
  const checks = await runDoctor();
  printChecks("Doctor", checks);
  return checks.every((check) => check.passed) ? 0 : 1;
};
