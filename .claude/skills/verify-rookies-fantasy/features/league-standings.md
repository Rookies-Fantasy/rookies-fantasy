# League standings

A league member opens a league and sees every team's name, logo and win-loss-draw record. Only members can see a league's standings.

## Sub-features

- `member-sees-standings`: a member gets all four Full League teams with their records.
- `non-member-forbidden`: a signed-in user outside the league is refused.
- `signed-out-unauthorized`: a signed-out request is refused.
- `unknown-league-not-found`: a league that doesn't exist answers 404.
- `malformed-id-rejected`: a malformed league ID answers 400.

## How to get to it (user POV)

- Sign in, open the league switcher, and pick a league. The league screen loads its standings through `getLeagueStandings`.

## Driving it with verify

Preconditions:

- Doctor passes.
- The baseline is seeded (every drive reseeds it).

```bash
npm --prefix scripts run verify -- drive league-standings
```

- **member-sees-standings:** 200 with exactly four teams: opponent 5-1-0, user 4-2-0, member 1 2-3-1, member 2 1-5-0.
- **non-member-forbidden:** `dev@test.com` on Open League answers 403 `Forbidden`.
- **signed-out-unauthorized:** 401 `Unauthorized`.
- **unknown-league-not-found:** 404 `League not found`.
- **malformed-id-rejected:** `not/an-id` answers 400 `Invalid request: leagueId is missing or malformed`.

## Gotchas

- `getLeagueStandings` is an `onRequest` function, not a callable: errors come back as plain-text bodies, not `{ error }` objects.
- Team order in the response isn't guaranteed; the case compares records by team ID.
