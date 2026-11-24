# Firebase Emulator Quick Start

Seed repeatable local states for drafting, matchmaking, and weekly matchups.

## One-Time Setup

You need Node 22, Java, the Firebase CLI, a development build of the app,
and access to the development Firebase project and its Functions settings.

Install dependencies from the repository root:

```bash
npm --prefix client ci
npm --prefix server/functions ci
npm --prefix scripts ci
```

## Start the Environment

From the repository root:

```bash
cd scripts
npm run dev
```

This builds Functions, starts fresh Firebase emulators, seeds the default
matchup scenario, and starts Expo in development emulator mode. Sign in as
`dev@test.com` with `password123`. Press **Ctrl+C** to stop Expo and Firebase.
Stop any existing Firebase or Expo processes before launching.

Data is discarded when the emulators stop. Open the Emulator UI at
`http://localhost:4000`. To change scenarios, see [Workflows](#workflows).

The app uses Metro's host to reach Firebase automatically. Leave
`EXPO_PUBLIC_EMULATOR_HOST` unset unless you need an override. For Expo tunnel
mode, set it in `client/.env.local` to a LAN or VPN IP reachable from the phone;
the tunnel only forwards Metro. See [network setup](#physical-phone-network-setup)
if the phone cannot connect.

### Manual Startup

Use separate terminals for Firebase, Expo, and the [workflow commands](#workflows).

#### 1. Firebase

Build the Functions, then start the emulators:

```bash
cd server/functions
npm run build
cd ..
firebase emulators:start
```

#### 2. Expo

Create `client/.env.local` (the launcher sets these flags automatically):

```dotenv
APP_ENV=development
EXPO_PUBLIC_USE_EMULATOR=true
```

```bash
cd client
npm start
```

Open the installed development build through the Expo QR code.
After changing `.env.local`, restart Expo and reopen the app. Switching
backends signs you out and clears cached Firestore data and pending writes.

## Workflows

Run commands from `scripts/`. All workflows use `dev@test.com` and
`opponent@test.com`, both with password `password123`; the league workflow
also adds `league1@test.com` and `league2@test.com`. Before switching
workflows, run `npm run seed:clear`, then reseed and relaunch the app.

### Draft a Team

Run `npm run seed:draft-ready`, then sign in and draft a team in the app.
The team starts empty with `$150M`; rerunning the command resets it.

### Test Matchmaking

Run `npm run seed:queue-ready` to create two idle users with complete teams.
Sign in, press **QUEUE**, then queue the opponent:

```bash
npm run queue:opponent
```

The backend creates the matchup once both users are queued.

### Advance a Premade Matchup

Run `npm run seed:scenario` to create two complete teams and an active matchup.
Reseeding reuses existing selected teams and their active matchup, preserving
snapshots. Completed matchups stay in history.

Add deterministic fake scores:

```bash
npm run simulate:day   # First day of the stored matchup week
npm run simulate:week  # Remaining days of that week
```

Dates stay within `weekStart` through `weekStart + 6`. Existing snapshots are
skipped, so reruns do not duplicate scores. To choose another day or start
partway through the week, use `SIM_DATE` below.

Run `npm run seed:end-matchup` to complete the main user's current matchup,
update team records, and return participants to idle. It is safe to repeat.

### Browse and Join Leagues

`seed:league-ready` creates four users, a complete ranked team for
`dev@test.com`, and two leagues:

| League ID              | Name        | Teams | Creator             | `dev@test.com` |
| ---------------------- | ----------- | ----- | ------------------- | -------------- |
| `emulator-league-full` | Full League | 4/4   | `dev@test.com`      | Member         |
| `emulator-league-open` | Open League | 2/6   | `opponent@test.com` | Not a member   |

The other members are `opponent@test.com`, `league1@test.com`, and
`league2@test.com`. Every member has a complete league team.

It also creates the active week 1 league matchup
`emulator-league-full-week-1-user` between the Full League teams of
`dev@test.com` and `opponent@test.com`. Ranked code ignores it: the app's
ranked matchup lookup and the weekly reset only read matchups with
`leagueId: null`, and `seed:end-matchup` refuses league matchups.

Sign in as `dev@test.com` and use the league switcher to open Full League.
The app only reaches the join screen through an invite link, so open Open
League with the development build's deep link:

```bash
# iOS simulator
xcrun simctl openurl booted "myapp-development://joinLeague?leagueId=emulator-league-open"
```

Re-running the seed command restores both leagues and their teams.

To add one more league for an existing user, pass that user's UID:

```bash
npx cross-env USER_ID=<uid> npm run seed:league
```

`seed:league` creates a league team for the user and a league with the user as
its creator and only member. It defaults to `LEAGUE_ID=default-league`,
`LEAGUE_NAME="Dev League"`, and `NUMBER_OF_TEAMS=4`. The league team gets a
Firestore-generated ID unless `LEAGUE_TEAM_ID` is set. If the league ID already exists, the command logs a
message and changes nothing; adding members to an existing league is not
supported yet.

### Test the Weekly Reset

`weeklyMatchupReset` runs on a schedule, which the emulator never triggers, and
`seed:end-matchup` only imitates it. To run the real function, seed a ranked
matchup and a league matchup, then call it from the Functions shell while the
emulators are running:

```bash
cd scripts
npm run seed:clear
npm run seed:league-ready
npm run seed:scenario

cd ../server/functions
npm run shell
```

Seed `league-ready` first. `seed:scenario` then turns `dev@test.com` and
`opponent@test.com` into matched users with the ranked matchup
`default-matchup`, and leaves their league teams and league matchup in place.

Before calling the function, confirm the shell logs
`Connected to running firestore emulator`; otherwise its writes go to the
development project. Then run:

```text
firebase > weeklyMatchupReset()
```

The log should report one active ranked matchup. `default-matchup` ends up
completed with scores, while `emulator-league-full-week-1-user` stays active and
the league team records do not change. The shell's warning that the Functions
emulator is already running is expected. Type `.exit` to leave.

## Optional Overrides

Simulation commands target all active matchups unless `MATCHUP_ID` is set.
Find IDs in the seed command output or Emulator UI. Use `cross-env` for
portable overrides:

```bash
# Choose a date within the matchup's stored week
npx cross-env SIM_DATE=2026-11-03 npm run simulate:day

# Add at most three pending days per matchup
npx cross-env SIM_DAYS=3 npm run simulate:week

# Target one matchup
npx cross-env MATCHUP_ID=your-matchup-id npm run simulate:week
```

`SIM_DATE` selects the day, or the starting day for `simulate:week`. Invalid
dates and dates outside a selected matchup's week cause an error before any
snapshots are written. Use `MATCHUP_ID` when active matchups cover different
weeks. `SIM_DAYS` must be a positive integer. `MATCHUP_ID` also works with
`seed:end-matchup`.

For custom accounts:

- `USER_EMAIL`: `seed:user`, `seed:draft-ready`, `seed:queue-ready`, or `seed:end-matchup`.
- `OPPONENT_EMAIL`: `seed:queue-ready` or `queue:opponent`.
- `HOME_USER_EMAIL` / `AWAY_USER_EMAIL`: `seed:scenario`.

`USER_PASSWORD` overrides the password.

`seed:user` preserves existing profile and game state when rerun.

## Physical Phone Network Setup

For physical phones, use the computer's LAN IP; `localhost` refers to the
phone itself.

### Windows: Recommended Setup

1. Make sure the phone and computer are connected to the same Wi-Fi network.
2. In Windows Settings, set the connected network's profile to **Private**.
3. Allow Node.js and Java/OpenJDK through the firewall on **Private networks**.
   If no prompt appears, open **Windows Security > Firewall & network protection**
   and select **Allow an app through firewall**.
4. Restart Firebase, Expo, and the app after changing settings.

### Windows: Manual Port Rules

If connections are still blocked, add private-network TCP inbound rules in
**Windows Defender Firewall with Advanced Security** for Functions (`5001`),
Firestore (`8080`), Auth (`9099`), and the Expo/Metro port (usually `8081`).
Restrict access to the local subnet or phone's IP.

### Verify the Connection

Open `http://<computer-ip>:8080` on the phone. If it responds, verify the same
IP appears in the app's `[Emulator] Connected` log. Restart Expo after changing
`.env.local`.

On iOS, allow the app's **Local Network** permission. On macOS, allow incoming
connections for Node and Java when prompted.

## Typechecking

Run `npm run typecheck` from `scripts/` to check the script types.

## Troubleshooting

- **Phone cannot load data:** Check Metro's LAN host and remove any stale
  `EXPO_PUBLIC_EMULATOR_HOST` override, then review the network steps above.
- **Queue button is missing:** Confirm `EXPO_PUBLIC_USE_EMULATOR=true`,
  `APP_ENV=development`, and a debug development build. Restart Expo after
  changing `.env.local`.
- **Users do not match:** Check the Functions log and confirm both users have
  complete teams.
- **Functions changes are stale:** Run `npm run build` from
  `server/functions/`, then restart the emulator.
- **Function secrets cannot load:** Run `firebase login` and confirm access to
  the development Firebase project.
- **The app shows an old state:** Reload the app after reseeding.
