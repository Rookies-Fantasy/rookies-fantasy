import { initEmulatorClient } from "../../emulator/core/client.js";
import { SEED_PASSWORD } from "../core/config.js";
import {
  type CaseRecord,
  createRunDir,
  describeDir,
  writeRun,
} from "../core/evidence.js";
import { readGitState } from "../core/git.js";
import { type Actor, signIn } from "../core/http.js";
import { readInstance } from "../core/instance.js";
import { formatTable, printChecks } from "../core/report.js";
import { seedBaseline } from "../core/seed.js";
import { FEATURES } from "../features/index.js";
import type { CaseOutcome, FeatureContext } from "../features/support.js";
import { runDoctor } from "./doctor.js";

const listFeatures = (): string =>
  FEATURES.map(
    (feature) => `  ${feature.id}  (${feature.cases.length} cases)`,
  ).join("\n");

export const run = async (featureId: string): Promise<number> => {
  const feature = FEATURES.find((entry) => entry.id === featureId) ?? null;

  if (feature === null) {
    console.error(
      featureId.length === 0
        ? "Name a feature to drive."
        : `Unknown feature "${featureId}".`,
    );
    console.error(`Features:\n${listFeatures()}`);
    return 1;
  }

  const checks = await runDoctor();
  const instance = readInstance();

  if (instance === null || !checks.every((check) => check.passed)) {
    printChecks("Doctor", checks);
    console.error(
      "\nDoctor failed, so nothing was driven. Fix the failing check first.",
    );
    return 1;
  }

  const { db, auth } = initEmulatorClient();
  const seed = await seedBaseline(db, auth);

  // Sign in after seeding: reseeding resets passwords, which revokes older tokens.
  const actors = new Map<string, Actor>();
  const actor = async (email: string): Promise<Actor> => {
    const cached = actors.get(email) ?? null;
    if (cached !== null) {
      return cached;
    }
    const signedIn = await signIn(email, SEED_PASSWORD);
    actors.set(email, signedIn);
    return signedIn;
  };
  const context: FeatureContext = { db, auth, seed, actor };

  const startedAt = new Date();
  const git = readGitState();
  const dir = createRunDir(startedAt, git.branch, feature.id);
  const records: CaseRecord[] = [];

  for (const featureCase of feature.cases) {
    let outcome: CaseOutcome;
    try {
      outcome = await featureCase.run(context);
    } catch (error) {
      outcome = {
        check: {
          passed: false,
          actual: `threw: ${error instanceof Error ? error.message : String(error)}`,
        },
        preconditions: [],
        exchanges: [],
        state: {},
      };
    }

    records.push({
      feature: feature.id,
      id: featureCase.id,
      title: featureCase.title,
      entryPoint: featureCase.entryPoint,
      expected: featureCase.expected,
      actual: outcome.check.actual,
      passed: outcome.check.passed,
      preconditions: outcome.preconditions,
      exchanges: outcome.exchanges,
      state: outcome.state,
    });
  }

  writeRun(dir, {
    feature: feature.id,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    git,
    instance,
    cases: records,
  });

  const passed = records.filter((record) => record.passed).length;
  console.log(`\n${feature.title}: ${passed}/${records.length} cases passed\n`);
  console.log(
    formatTable(
      ["Case", "Result", "Actual"],
      records.map((record) => [
        record.id,
        record.passed ? "PASS" : "FAIL",
        record.actual,
      ]),
    ),
  );
  console.log(`\nEvidence: ${describeDir(dir)}/summary.md`);

  return passed === records.length ? 0 : 1;
};

export const features = (): number => {
  console.log(`Features:\n${listFeatures()}`);
  return 0;
};
