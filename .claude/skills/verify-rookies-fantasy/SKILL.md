---
name: verify-rookies-fantasy
description: Verify rookies-fantasy server behavior by driving the real Cloud Functions on local Firebase emulators and saving evidence. Use when proving a change to leagues (create, join, standings) works, when a PR needs rerunnable evidence, or when launching, checking or stopping this skill's emulators.
---

# Verify rookies-fantasy

Drive the app the way the client does: sign in as seeded users through the Auth emulator and call the real Cloud Functions over HTTP, exactly as `client/utils/callableUtils.ts` does. Every check runs through one fixed CLI, so every run measures the same thing. Use it instead of writing a one-off script.

The surface driven here is the Functions API. The mobile UI is not driven: UI checks stay manual on a phone, and a proof says so.

All commands run from the repo root:

```bash
npm --prefix scripts run verify -- <command>
```

## Launch

```bash
npm --prefix scripts run verify -- launch
```

It builds `server/functions`, starts the emulators (Auth 9099, Firestore 8080, Functions 5001, hub 4400, UI 4000) from an empty state, waits until they are ready, seeds the **baseline** (the `league-ready` scenario from `scripts/emulator`), and finishes by running doctor. Ready means doctor passes, not just that a port answers.

If any emulator port is already in use, launch refuses and exits 1. That instance belongs to someone else, usually the user's own terminal: ask them to stop it, then launch again. This skill only ever drives emulators it launched itself.

## Doctor

```bash
npm --prefix scripts run verify -- doctor
```

A read-only answer to "is this instance worth driving?". It checks that the recorded process is alive, the emulator hub reports that same PID, Auth, Firestore and Functions are on their ports, `createLeague`, `joinLeague` and `getLeagueStandings` are loaded, the build matches the checked-out commit and uncommitted Functions edits, and `dev@test.com` can sign in.

Run doctor first, and again after anything surprising. When "build matches checkout" fails because the code changed, run cleanup, then launch.

## Drive

```bash
npm --prefix scripts run verify -- features
npm --prefix scripts run verify -- drive <feature>
```

Each drive runs doctor, reseeds the baseline, runs every case of one feature in order, prints a table, and exits 1 if any case fails. The feature map in [`features/README.md`](features/README.md) says what each feature is, how a user reaches it, and what proves it works. Read the feature file before driving it, and drive every feature a change touches.

Proof standards for every case:

- The action goes through the real entry point the app uses. Direct Firestore writes only stage preconditions (a team document, a full league), and each case lists them.
- A case proves the response **and** the resulting Firestore state, so a rejected request also shows that nothing was written.
- A failing case is a finding. Report it with its evidence. The case stays as written: either the product is wrong (report it) or the map drifted (fix the map and the case together, and say so).

## Evidence

Every drive writes `.claude/skills/verify-rookies-fantasy/runs/<timestamp>-<branch>-<feature>/` (gitignored):

- `summary.md`: result count, branch, commit, uncommitted changes, which launch it ran against, and a table of every case's entry point, expected and actual result.
- `run.json`: the same, machine-readable.
- `cases/NN-<case>.json`: each case's preconditions, every request and response (signed-in user named, token omitted), and the Firestore documents it read.

Launch writes `runs/<timestamp>-<branch>-launch/emulators.log`. To report a proof, paste the drive's printed table and link its `summary.md`.

## Cleanup

```bash
npm --prefix scripts run verify -- cleanup
```

Stops the process tree launch recorded, waits for the ports to free, and removes the record (`runs/instance.json`). It never stops anything else, and it keeps every `runs/` folder. Clean up when verification is done, and after any failed launch.

## Helpers

The CLI lives in `scripts/verify/`:

- `commands/`: `launch`, `doctor`, `drive`, `cleanup`.
- `features/`: one file of cases per feature, registered in `features/index.ts`.
- `core/`: emulator config, HTTP calls, evidence and the baseline seed.

To cover new behavior, add cases to that feature's file in `scripts/verify/features/`, and add its sub-feature ID and observable result to the matching `features/*.md` here. Run the new case against the code before the change and confirm it fails for the reason it names; a case that already passes proves nothing new. A new feature gets both files plus an entry in `features/index.ts` and `features/README.md`.
