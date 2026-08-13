# Firebase Emulator Setup

This folder contains the local testing workflow for the Firebase Auth and Firestore emulators.

The goal is to make it easy to:

- sign in on a physical phone through Expo QR
- seed a repeatable dev scenario
- queue users and let the local matching trigger run
- simulate matchup days or a full week
- end a matchup and start over

## What This Setup Supports

- Physical phones over Expo QR are the main test target.
- Windows and macOS dev machines are both supported.
- Emulator networking can be local LAN today and changed later if the team prefers a VPN path.
- The default workflow is intentionally simple and repeatable rather than fully generic.

## Prerequisites

- Node installed
- Firebase CLI installed
- Expo client dependencies installed in `client/`
- Firebase emulator dependencies installed in `server/functions/`
- The local Firebase emulators running

## Start The Emulators

From `server/`:

```bash
firebase emulators:start
```

This starts the local Firebase services and the Emulator UI.

Useful local defaults:

- Firestore emulator: `http://localhost:8080`
- Auth emulator: `http://localhost:9099`
- Emulator UI: `http://localhost:4000`

## Start The Client

From `client/`:

```bash
npm run dev
```

The app is already wired to connect to the emulators when emulator mode is enabled.

For a physical phone, make sure the client is using the emulator host that your phone can reach.

## Seed A Default Scenario

From `scripts/`:

```bash
npm run seed:scenario
```

This creates the default dev setup:

- a primary dev user
- a default opponent user
- teams for both users
- a default matchup

Default credentials:

- Email: `dev@test.com`
- Password: `password123`

The scenario is meant to be rerunnable, so using the same command again should not require rebuilding everything by hand.

## Queue Users For Matchmaking

The actual matchup flow is still handled by the local Cloud Function trigger.

To test matchmaking:

1. Seed the scenario.
2. Open the Firebase Emulator UI.
3. Edit the queued users in Firestore and set `queueStatus` to `queued`.
4. Let the local `processQueue` trigger run.

This is the closest approximation to production behavior for now, without needing two phones to race each other.

## Simulate Matchups

Run a deterministic fake day:

```bash
npm run simulate:day
```

Run a week starting from a chosen date:

```bash
SIM_DATE=2026-08-11 npm run simulate:week
```

The simulator now respects the current Monday-Sunday matchup week and skips days that already have snapshots.

## End A Matchup

When you want to finish the matchup and reset the users:

```bash
npm run seed:end-matchup
```

This marks the matchup completed and resets both users and teams back to an idle state.

## Suggested Daily Workflow

1. Start the Firebase emulators.
2. Start the client in Expo dev mode.
3. Seed the default scenario.
4. Open the app on a physical phone.
5. Queue users in the Emulator UI if you want to test matchmaking.
6. Use `simulate:day` or `simulate:week` to advance the matchup.
7. Use `seed:end-matchup` to finish the matchup and test the reset flow.

## Notes

- `simulate:day` and `simulate:week` are deterministic.
- Re-running them is intended to be safe for already-seeded matchup days.
- If the team later wants richer custom scenarios, the current seed helpers should still be a good base to extend from.
