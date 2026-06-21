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
- Typecheck: `npm run tsc`
- Lint: `npm run lint`

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
- **Environments**: development, preview (staging), production. `npm run dev` uses development. Firebase config files are env-specific — don't assume a single config
- **Typed routes**: Expo Router typed routes are enabled — use typed route strings in `router.push()` calls
- **Issue tracker**: Linear — ticket format is `ENG-123` (not `#123`)

## TypeScript Conventions

- Do not use `undefined`, `any`, or `unknown` unless purposefully mentioned — use explicit types and proper fallbacks instead
  - For missing images: use a placeholder asset, not `undefined`
  - For missing data: use typed defaults, not `undefined` returns
  - `any` bypasses type safety entirely — map raw data to typed shapes at the boundary (e.g. Firestore responses in controllers)
