# Client — Expo React Native

## Stack
- **Routing**: Expo Router (file-based, `app/` dir)
- **Styling**: NativeWind (Tailwind classes on RN components)
- **State**: Redux Toolkit (`state/slices/`) + TanStack Query for server state
- **Forms**: React Hook Form + Yup
- **Icons**: Phosphor React Native
- **Auth/DB**: React Native Firebase (auth, firestore, crashlytics)

## App structure
```
app/
  (auth)/           # login, signUp, forgotPassword, emailVerification, confirmReset
  (protected)/
    (tabs)/         # index (My Team), arena, matchHistory, freeAgents, leaderboard
    (draft)/        # draft flow
    createLeague, createProfile, createTeam
```

## Key directories
- `components/` — shared UI components
- `controllers/` — business logic (league, matchup, user, nbaPlayers, nbaTeams, augment, ballDontLie)
- `state/slices/` — Redux slices: user, team, league, matchup
- `hooks/` — useCountdown, useLineupLock

## Commands (run from `client/`)
- Dev: `npm run dev`
- Test: `npm run test-ci`
- Typecheck: `npm run tsc`
- Lint: `npm run lint`

## Key Considerations

- `@/` resolves to the `client/` root (e.g. `@/components/Button`, `@/types/league`)
- **State**: Use Redux for client/UI state; use TanStack Query for server/async data fetching — don't mix them
- **Controllers**: Static classes with direct Firestore calls (see `controllers/`). Follow this pattern for new data access logic
- **Environments**: development, preview (staging), production. `npm run dev` uses development. Firebase config files are env-specific — don't assume a single config
- **Typed routes**: Expo Router typed routes are enabled — use typed route strings in `router.push()` calls
- **Issue tracker**: Linear — ticket format is `ENG-123` (not `#123`)
