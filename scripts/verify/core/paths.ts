import { execFileSync } from "node:child_process";
import path from "node:path";

const readRepoRoot = (): string =>
  execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();

export const REPO_ROOT = path.resolve(readRepoRoot());
export const SERVER_DIR = path.join(REPO_ROOT, "server");
export const FUNCTIONS_DIR = path.join(SERVER_DIR, "functions");
export const SKILL_DIR = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "verify-rookies-fantasy",
);
export const RUNS_DIR = path.join(SKILL_DIR, "runs");
export const INSTANCE_FILE = path.join(RUNS_DIR, "instance.json");

export const relativeToRepo = (target: string): string =>
  path.relative(REPO_ROOT, target).split(path.sep).join("/");
