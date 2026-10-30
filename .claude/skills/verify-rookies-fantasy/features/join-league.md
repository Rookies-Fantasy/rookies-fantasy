# Join a league

A user opens an invite link, creates a league team, and joins. The server adds the team and user to the league, or rejects the join and leaves the league untouched.

## Sub-features

- `joins-open-league`: a new member joins Open League; its member count goes from 2 to 3.
- `rejects-second-team-same-user`: an existing member can't join again with another team.
- `rejects-team-already-in-league`: a team ID already in the league is rejected.
- `rejects-full-league`: a user outside a full league can't join it.
- `rejects-unknown-league`: an invite link to a league that doesn't exist is rejected.
- `rejects-someone-elses-team`: a team the user doesn't own is rejected.
- `rejects-signed-out`: a signed-out request is rejected.

## How to get to it (user POV)

- An invite link `myapp-development://joinLeague?leagueId=<id>` opens the join screen, which loads the league, takes the team name, abbreviation and logo, and submits.
- The app creates the team under `users/{uid}/teams` first, then calls `joinLeague` with the league and team IDs. There is no in-app browse-to-join path.

## Driving it with verify

Preconditions:

- Doctor passes.
- Cases stage their own teams and, for `rejects-full-league`, the auth user `verify-outsider@test.com`.

```bash
npm --prefix scripts run verify -- drive join-league
```

- **joins-open-league:** 200; stored `leagues/emulator-league-open` goes from `memberCount` 2 to 3 and contains the new team and `dev@test.com`'s UID.
- **Every rejection:** the callable error the case names (`ALREADY_EXISTS`, `RESOURCE_EXHAUSTED`, `NOT_FOUND` or `UNAUTHENTICATED`), and the league document identical before and after.

## Gotchas

- Cases run in order: the later Open League cases see `dev@test.com` as a member because `joins-open-league` ran first.
- The server checks the team before the league, so `rejects-unknown-league` stages a real team; without one it reports `Team not found` instead.
- Every baseline user is already in Full League, so `rejects-full-league` needs the outsider account or it reports `User already joined`.
