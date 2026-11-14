# rookies-fantasy verification map

The maintained source for verifying the user-facing behavior of rookies-fantasy leagues. Read this index before driving, then use the matching feature file as the recipe.

## Baseline preconditions

- Emulators launched by this skill and doctor passing (`npm --prefix scripts run verify -- doctor`).
- The baseline is the `league-ready` scenario, reseeded at the start of every drive:
  - `emulator-league-full`: Full League, 4/4, created by `dev@test.com`. Records: opponent 5-1-0, dev 4-2-0, member 1 2-3-1, member 2 1-5-0.
  - `emulator-league-open`: Open League, 2/6, created by `opponent@test.com` with `league1@test.com`.
  - Users `dev@test.com`, `opponent@test.com`, `league1@test.com` and `league2@test.com`, all with password `password123`.

## Driving conventions

- Drive through `npm --prefix scripts run verify -- drive <feature>`. Each feature's cases are its sub-features, in order.
- Cases within a feature build on each other's writes; run the whole feature, not one case.
- Requests match the client: `POST { data }` with a Bearer ID token for callables, `GET ?leagueId=` with a Bearer token for `getLeagueStandings`.

## Proof and skip reporting

- A case's proof is its response plus the Firestore state it read afterwards, in `runs/.../cases/`.
- The mobile UI is not driven. Report UI steps as manual phone checks, never as covered by a drive.
- Report an unreachable case with the command run and the unmet precondition.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph on the user-visible behavior, then exactly four H2 sections in this order:

1. `Sub-features`: case IDs, one line each.
2. `How to get to it (user POV)`: every entry point in the app.
3. `Driving it with verify`: preconditions, the drive command, and the observable result that proves each sub-feature.
4. `Gotchas`: traps that waste or invalidate a run.

## Features

- [Create a league](./create-league.md): the create-league form and its server-side validation.
- [Join a league](./join-league.md): joining through an invite link, and every rejection.
- [League standings](./league-standings.md): who can see a league's records.
