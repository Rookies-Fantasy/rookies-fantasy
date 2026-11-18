import fs from "node:fs";
import path from "node:path";
import type { GitState } from "./git.js";
import type { Exchange } from "./http.js";
import type { InstanceState } from "./instance.js";
import type { JsonObject } from "./json.js";
import { RUNS_DIR, relativeToRepo } from "./paths.js";
import { formatMarkdownTable } from "./report.js";

export type CaseRecord = {
  feature: string;
  id: string;
  title: string;
  entryPoint: string;
  expected: string;
  actual: string;
  passed: boolean;
  preconditions: string[];
  exchanges: Exchange[];
  state: JsonObject;
};

export type RunRecord = {
  feature: string;
  startedAt: string;
  finishedAt: string;
  git: GitState;
  instance: InstanceState;
  cases: CaseRecord[];
};

const timestamp = (date: Date): string =>
  date
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d+Z$/, "Z");

const slug = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

export const createRunDir = (
  date: Date,
  branch: string,
  label: string,
): string => {
  const dir = path.join(
    RUNS_DIR,
    `${timestamp(date)}-${slug(branch)}-${slug(label)}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const caseFileName = (index: number, record: CaseRecord): string =>
  `${String(index + 1).padStart(2, "0")}-${record.id}.json`;

const writeJson = (file: string, value: object): void => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

export const writeRun = (dir: string, run: RunRecord): void => {
  run.cases.forEach((record, index) => {
    writeJson(path.join(dir, "cases", caseFileName(index, record)), record);
  });

  writeJson(path.join(dir, "run.json"), {
    ...run,
    cases: run.cases.map((record, index) => ({
      id: record.id,
      passed: record.passed,
      file: `cases/${caseFileName(index, record)}`,
    })),
  });

  const passedCount = run.cases.filter((record) => record.passed).length;
  const dirty =
    run.git.dirtyFiles.length === 0
      ? "clean"
      : `${run.git.dirtyFiles.length} uncommitted change(s)`;

  const summary = [
    `# verify-rookies-fantasy: ${run.feature}`,
    "",
    `- Result: ${passedCount}/${run.cases.length} cases passed`,
    `- Branch: \`${run.git.branch}\` at \`${run.git.commit}\` (${dirty})`,
    `- Emulators: launched ${run.instance.launchedAt} from \`${run.instance.commit}\`, PID ${run.instance.pid}`,
    `- Started: ${run.startedAt}`,
    `- Finished: ${run.finishedAt}`,
    "",
    formatMarkdownTable(
      ["Case", "Entry point", "Expected", "Actual", "Result"],
      run.cases.map((record) => [
        record.id,
        record.entryPoint,
        record.expected,
        record.actual,
        record.passed ? "PASS" : "FAIL",
      ]),
    ),
    "",
    "Each case's request, response and resulting Firestore state are in `cases/`.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(dir, "summary.md"), summary);
};

export const describeDir = (dir: string): string => relativeToRepo(dir);
