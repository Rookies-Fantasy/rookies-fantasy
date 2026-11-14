# Create a league

A signed-in user names a league, picks a team count and budget, creates their league team, and submits. The server creates the league with the user as its creator and only member, and rejects anything the form would never send.

## Sub-features

- `creates-league`: a valid submission creates the league with one member.
- `rejects-off-step-team-count`: a team count off the 4–20, step-2 stepper is rejected.
- `rejects-off-step-budget`: a budget off the $150M–$250M, step-$25M stepper is rejected.
- `rejects-blank-name`: a blank name is rejected.
- `rejects-someone-elses-team`: a team the user doesn't own is rejected.
- `rejects-signed-out`: a signed-out request is rejected.

## How to get to it (user POV)

- The league switcher in the tabs header (it shows the current league, or "Ranked") → **Create New League**: step 1 is the league name, team count and budget; step 2 is the team name, abbreviation and logo; then **Create League** submits. There is no separate Leagues screen.
- The app creates the team under `users/{uid}/teams` first, then calls `createLeague` with its ID.

## Driving it with verify

Preconditions:

- Doctor passes.
- `dev@test.com` has a league team `verify-create-team` (staged by each case).

```bash
npm --prefix scripts run verify -- drive create-league
```

- **creates-league:** 200, and both the response and the stored `leagues/{id}` hold the submitted `name`, `numberOfTeams` and `budget` plus `memberCount: 1`, `teamIds: [verify-create-team]` and `userIds: [dev uid]`. Only the stored document has `creatorUserId: dev uid`; the response doesn't include it.
- **Every rejection:** the callable error status and message the case names (`INVALID_ARGUMENT`, `NOT_FOUND` or `UNAUTHENTICATED`), and the league count unchanged.

## Gotchas

- The server keeps its own copy of the form limits (`server/functions/src/leagues/types.ts`, mirroring `createLeague.tsx`). A change to one side needs the other, or the cases drift from the UI.
- `rejects-someone-elses-team` uses the opponent's Open League team, so it depends on the baseline.
- Each case stages its own team, so the drive doesn't show what the app does when the server rejects a submit: the team the app wrote first stays in `users/{uid}/teams`. Check that on a phone.
