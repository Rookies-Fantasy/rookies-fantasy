# Firebase Emulator Setup

This folder contains local testing helpers for the Firestore/Auth emulators.

## Commands

- `npm run seed:clear`
- `npm run seed:dev-user`
- `npm run seed:opponent`
- `npm run seed:user`
- `npm run seed:team`
- `npm run seed:matchup`
- `npm run seed:end-matchup`
- `npm run seed:scenario`
- `npm run seed:nba-players`
- `npm run seed:nba-teams`
- `npm run simulate:day`
- `npm run simulate:week`
- `npm run dev`

## Current Notes

- This is the first pass of the emulator workflow.
- The seed helpers are intentionally small and schema-aligned.
- `simulate:day` writes deterministic fake snapshots for active matchups so we can step through a week without live NBA data.
- `simulate:week` runs `simulate:day` across the current Monday-Sunday matchup week. Use `SIM_DATE` to choose the starting day and `SIM_DAYS` to limit how many missing days are filled.
- Re-running the same seed/sim command is intended to be safe for the default scenario because the scripts now skip already-created matchup snapshots.
- `seed:end-matchup` marks the current default matchup completed and resets both users back to idle.
