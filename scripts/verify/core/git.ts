import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./paths.js";

export type GitState = {
  branch: string;
  commit: string;
  dirtyFiles: string[];
  // Identifies the exact Functions source the emulator was built from,
  // including uncommitted edits, so doctor can tell when a build is stale.
  functionsSourceHash: string;
};

const FUNCTIONS_PATH = "server/functions";

const git = (args: string[]): string =>
  execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });

const hashFunctionsSource = (): string => {
  const hash = createHash("sha256");
  hash.update(git(["rev-parse", `HEAD:${FUNCTIONS_PATH}`]));
  hash.update(git(["diff", "HEAD", "--", FUNCTIONS_PATH]));

  const untracked = git([
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    FUNCTIONS_PATH,
  ])
    .split("\n")
    .filter((file) => file.length > 0)
    .sort();

  for (const file of untracked) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(REPO_ROOT, file)));
  }

  return hash.digest("hex").slice(0, 16);
};

export const readGitState = (): GitState => ({
  branch: git(["rev-parse", "--abbrev-ref", "HEAD"]).trim(),
  commit: git(["rev-parse", "HEAD"]).trim(),
  dirtyFiles: git(["status", "--porcelain"])
    .split("\n")
    .filter((line) => line.length > 0),
  functionsSourceHash: hashFunctionsSource(),
});
