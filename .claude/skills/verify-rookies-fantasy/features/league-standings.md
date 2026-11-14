# League standings

A league member opens a league and sees every team's name, logo and win-loss-draw record. Only members can see a league's standings.

## Sub-features

- `member-sees-standings`: a member gets all four Full League teams with their records.
- `non-member-forbidden`: a signed-in user outside the league is refused.
- `signed-out-unauthorized`: a signed-out request is refused.
- `unknown-league-not-found`: a league that doesn't exist answers 404.
- `malformed-id-rejected`: a malformed league ID answers 400.

## How to get to it (user POV)

- Sign in, pick a league in the tabs-header league switcher (creating or joining a league also selects it), and open the **Leaderboard** tab. It loads the standings through `getLeagueStandings`. With "Ranked" selected, the tab shows a placeholder and sends no request.
- Rank, points (3 per win, 1 per draw) and win% are computed on the phone from the returned records; the server returns only each team's name, logo and record.

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

- `getLeagueStandings` is an `onRequest` function, not a callable: the 400, 401, 403 and 404 errors come back as plain-text bodies. Only an unexpected failure (500, including a corrupt league document) returns JSON `{ error }`.
- Team order in the response isn't guaranteed; the case compares records by team ID.
