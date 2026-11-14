# Server — Firebase Cloud Functions

## Stack
- **Runtime**: Node 22, TypeScript, `firebase-functions` **v1 API** (`firebase-functions/v1`). Don't migrate to v2 as part of other work
- **Data**: Firestore via `firebase-admin`
- **External data**: BallDontLie (`@balldontlie/sdk` and raw `fetch`) for NBA stats and schedules

## Commands (run from `server/functions/`)
- Dev: `npm run serve` (builds + starts emulator)
- Build: `npm run build`
- Lint: `npm run lint`
- Deploy: `npm run deploy`

## Source structure
Code is organized by feature. `src/index.ts` only re-exports deployed functions.

```
src/
  index.ts      # re-exports only — no logic
  leagues/      # leagues: createLeague, joinLeague, getLeagueStandings (+ input validation)
  players/      # NBA player data: getLiveData, updateDailyPlayerData (+ its fetch and write steps)
  matchups/     # weekly matchups: weeklyMatchupReset, getEarliestGameStartTime (lineup lock),
                #   createWeeklyMatchup, snapshotDailyLineups, completeMatchup
  ranked/       # ranked-mode matchmaking: processQueue
  users/        # auth triggers: createUserInDatabase
  scoring/      # fantasy points, augments, lineup snapshots — pure logic, no Firebase imports
  shared/       # admin init, BallDontLie client, date and batch helpers, cross-feature types
```

## Where things go
- **New deployed function**: its own file named after the export (e.g. `matchups/weeklyMatchupReset.ts`), in the folder of the feature it serves, then add one `export { name } from "./folder/name";` line to `index.ts`
- **New feature** (like `leagues/`): a new top-level folder, not a subfolder of an existing one
- **Helpers used by one feature**: in that feature's folder. Move to `shared/` only once a second feature needs them
- **Types**: in the owning feature's `types.ts`; only types used across features go in `shared/types.ts`
- **Scoring logic**: in `scoring/`, which must stay free of `firebase-admin` / `firebase-functions` imports so it can be tested without the emulator
- **Firestore access**: import `admin` from `shared/admin` (it calls `initializeApp()`), never from `firebase-admin` directly. Import `FieldValue` / `FieldPath` from `shared/admin` too, not `admin.firestore.FieldValue`, which is undefined in the Functions emulator
- **Code imported by `scripts/`**: `matchups/completeMatchup.ts` is also run by the emulator seed scripts, so it takes `db` as a parameter and must not import `shared/admin`
- **BallDontLie calls**: use `api` / `fetchAllPagesFromUrl` from `shared/balldontlie`. Only import the SDK there, so functions that don't need it don't load it on cold start

## Rules
- **Export names are deployed function names.** Renaming an export (or removing it from `index.ts`) makes the next deploy create a new function and delete the old one. Moving code between files is safe as long as the export name stays the same
- Secrets (e.g. `BALLDONTLIE_API_KEY`) are declared per function with `.runWith({ secrets: [...] })` and read from `process.env`
- League-wide reads of team docs (e.g. standings) go through an admin Cloud Function. Team docs are private per user, so the client can't fan out over them
- New code avoids `any`: define explicit shapes at data boundaries (BallDontLie responses, Firestore docs)
- Run `npm run lint` and `npm run build` before committing; both must pass
