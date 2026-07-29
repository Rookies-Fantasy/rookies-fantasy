# Firebase Emulator Setup

This folder contains local testing helpers for the Firestore/Auth emulators.

## Commands

- `npm run seed:clear`
- `npm run seed:user`
- `npm run seed:team`
- `npm run seed:matchup`
- `npm run seed:scenario`
- `npm run seed:nba-players`
- `npm run seed:nba-teams`
- `npm run simulate:day`
- `npm run dev`

## Current Notes

- This is the first pass of the emulator workflow.
- The seed helpers are intentionally small and schema-aligned.
- `simulate:day` writes deterministic fake snapshots for active matchups so we can step through a week without live NBA data.
