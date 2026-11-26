# rookies-fantasy

This is an NBA fantasy sports mobile app. Users can play in leagues or in a competitive ranked mode, selecting/drafting NBA players, and competing in weekly matchups.

## Monorepo structure
- `client/` — Expo React Native app (see `client/CLAUDE.md`)
- `server/functions/` — Firebase Cloud Functions (TypeScript, Node 22)
- `scripts/` — One-off Node.js scripts for Firestore data changes

## Conventions
- Branch: `{type}/eng-{ticket}-{description}` (types: feature, bugfix, docs)
- PRs: follow `.github/pull_request_template.md`

## Server (Firebase Functions)
From `server/functions/`:
- Dev: `npm run serve` (builds + starts emulator)
- Deploy: `npm run deploy`
- Lint: `npm run lint`
- Test: `npm test` (`node:test` on compiled output, no test framework dependency)
- Composite indexes live in `server/firestore.indexes.json`; add one there with any query that needs it. The emulator never enforces indexes, so a missing one fails only in a deployed project. `npm run deploy` ships functions only: deploy indexes with `firebase deploy --only firestore:indexes`, which treats any index absent from the file as one to delete
- External data: BallDontLie SDK (`@balldontlie/sdk`) for NBA stats

## Important Notes

- NEVER commit .env files
- Issue tracker is Linear — ticket format is `ENG-123` (not `#123`)
- Run `npx eslint .` from `client/` before every commit and push; fix all errors before committing
