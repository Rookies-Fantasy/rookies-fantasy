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
- `theme/` — `theme.ts` defines `ThemeName` (Purple, Green) and `ThemeMode`, and `applyCssTheme()` which resolves the `primary-*`, `mode`, and `modeContrast` CSS vars at runtime. `ThemeProvider.tsx` wraps the app
- `types/` — shared TypeScript types for all domain entities (league, team, player, matchup, augment, user, etc.). Always import types from here rather than defining inline
- `utils/` — reusable helper functions (see Utilities section below)

## Commands (run from `client/`)
- Dev: `npm run dev`
- Test: `npm run test-ci`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`

## Local development (Firebase emulator over Tailscale)

Local dev runs against the Firebase emulator suite, not the deployed
`rookies-fantasy-development` project. Copy `.env.example` to `.env.local` and
fill it in — it documents every variable.

Three terminals:
1. `cd server/functions && npm run serve` — Auth (9099), Firestore (8080), Functions (5001). State imports/exports between runs via `server/emulator-data/`
2. `cd scripts && npm run seed-mock` — seeds users, NBA teams/players, augments, teams, matchups and a league. Needs `BALLDONTLIE_API_KEY` in `scripts/.env`. Seeded accounts use password `Test1234`
3. `cd client && npm run dev`

**Tailscale**: devices reach the emulators over Tailscale, so a physical device doesn't have to share a network with the host machine. Set both `EXPO_PUBLIC_EMULATOR_HOST` and `REACT_NATIVE_PACKAGER_HOSTNAME` to your MagicDNS name (`tailscale status`). The emulators bind `0.0.0.0` in `server/firebase.json` for this reason.

Two things that will bite you:
- `EXPO_PUBLIC_EMULATOR_HOST` is read by `app.config.ts` at **prebuild** time to write an iOS ATS exception domain, because Tailscale's 100.64.0.0/10 CGNAT addresses don't count as local networking to iOS and cleartext to them is otherwise blocked. Changing the host needs a native rebuild (`npx expo run:ios`), not just a Metro restart
- **Android is not wired up for this yet.** The ATS work is iOS-only and Android 9+ blocks cleartext HTTP by default; there's no `android.usesCleartextTraffic` in the `expo-build-properties` config and no network security config. Use iOS or a simulator for emulator work

**Backend selection** (`firebase/environment.ts`, `firebase/config.ts`): three signals must agree before emulator wiring engages — `EXPO_PUBLIC_USE_EMULATOR=true`, `APP_ENV=development`, and `__DEV__`. `EXPO_PUBLIC_*` values are inlined at build time, so the flag alone would let a release build ship pointing at localhost. Switching backends signs the user out and clears Firestore persistence.

## Styling (NativeWind + Design System)

All styling is done via NativeWind `className` props — never use `StyleSheet.create()` unless you really have to (please explain why you decided to use it if you do).

**Colors** — always use tokens from `tailwind.config.js`, never hardcode hex values:
- Grays: `gray-{25–950}` (note: `gray-920` and `gray-950` are custom additions)
- Brand: `purple-{25–950}`, `green-{25–950}`, `red-{25–950}`, `yellow-{25–950}`
- White: `base-white`
- Theme-aware: `primary-{25–950}`, `mode`, `modeContrast` (CSS vars, respect dark mode)

**Typography** — always use `pbk-*` composite classes on `<Text>`, never set font/size manually:
- Headings (ClashDisplay): `pbk-h1` → `pbk-h8`
- Subheadings (ClashDisplay): `pbk-sh1` → `pbk-sh3`
- Body (Manrope): `pbk-bl`, `pbk-b1` → `pbk-b3`
- Example: `<Text className="pbk-h5 text-base-white">`

**Conditional classes** — use `cn` from `@/utils/jsUtils` (wraps `clsx` + `tailwind-merge`):
- Example: `className={cn("rounded-xl p-4", isSelected ? "bg-purple-900" : "bg-gray-900")}`

## Utilities (`utils/`)

Before writing new logic, check `utils/` for existing helpers — and add new reusable logic there rather than inlining it:
- `jsUtils.ts` — `cn()` for class merging, `isNil`/`isNotNil` guards
- `authUtils.ts` — auth helpers
- `dateUtils.ts` — date formatting/manipulation
- `fantasyPoints.ts` — fantasy scoring logic
- `teamUtils.ts` — team-related helpers
- `augmentUtils.ts` — augment-related helpers

## Key Considerations

- `@/` resolves to the `client/` root (e.g. `@/components/Button`, `@/types/league`)
- **State**: Use Redux for client/UI state; use TanStack Query for server/async data fetching — don't mix them
- **Controllers**: Static classes with direct Firestore calls (see `controllers/`). Follow this pattern for new data access logic
- **Environments**: development, preview (staging), production. `npm run dev` uses development. Firebase config files are env-specific — don't assume a single config. For running against local emulators see the Local development section above
- **Typed routes**: Expo Router typed routes are enabled — use typed route strings in `router.push()` calls
- **Issue tracker**: Linear — ticket format is `ENG-123` (not `#123`)

## TypeScript Conventions

- Do not use `undefined`, `any`, or `unknown` unless purposefully mentioned — use explicit types and proper fallbacks instead
  - For missing images: use a placeholder asset, not `undefined`
  - For missing data: use typed defaults, not `undefined` returns
  - `any` bypasses type safety entirely — map raw data to typed shapes at the boundary (e.g. Firestore responses in controllers)
