# rookies-fantasy

This is an NBA fantasy sports mobile app. Users can play in leagues or in a competitive ranked mode, selecting/drafting NBA players, and competing in weekly matchups.

## Monorepo structure
- `client/` — Expo React Native app (see `client/CLAUDE.md`)
- `server/functions/` — Firebase Cloud Functions (TypeScript, Node 22) (see `server/CLAUDE.md`)
- `scripts/` — One-off Node.js scripts for Firestore data changes

## Conventions
- Branch: `{type}/eng-{ticket}-{description}` (types: feature, bugfix, docs)
- PRs: follow `.github/pull_request_template.md`

## Important Notes

- NEVER commit .env files
- Issue tracker is Linear — ticket format is `ENG-123` (not `#123`)
- Run `npx eslint .` from `client/` before every commit and push; fix all errors before committing
