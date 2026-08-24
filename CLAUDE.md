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
- External data: BallDontLie SDK (`@balldontlie/sdk`) for NBA stats

## Local development

Local work runs against the Firebase emulator suite, not the deployed
`rookies-fantasy-development` project:
1. `server/functions/` — `npm run serve` (Auth 9099, Firestore 8080, Functions 5001; state persists in `server/emulator-data/`)
2. `scripts/` — `npm run seed-mock` (needs `BALLDONTLIE_API_KEY` in `scripts/.env`)
3. `client/` — `npm run dev`

Devices reach the emulators over Tailscale. Setup and caveats live in
`client/.env.example` and the Local development section of `client/CLAUDE.md`
— note that emulator work is iOS/simulator only, Android cleartext is not
configured.

## Important Notes

- NEVER commit .env files
- Issue tracker is Linear — ticket format is `ENG-123` (not `#123`)
- Run `npx eslint .` from `client/` before every commit and push; fix all errors before committing
