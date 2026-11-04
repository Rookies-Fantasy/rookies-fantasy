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

Create the ignored file `client/.env.local`:

```dotenv
APP_ENV=development
EXPO_PUBLIC_USE_EMULATOR=true
```

The app connects to emulators only when the flag is enabled, `APP_ENV` is
`development`, and the app is running a debug build. Preview and production
builds use their native Firebase project's cloud services. Functions use the
same native project ID as Auth and Firestore.

Firebase uses Metro's host automatically, with the port removed. Leave
`EXPO_PUBLIC_EMULATOR_HOST` unset to follow the computer's LAN IP. The phone
and computer must be on the same reachable network. See
[Physical Phone Network Setup](#physical-phone-network-setup) if the phone
cannot connect.

Set `EXPO_PUBLIC_EMULATOR_HOST` only to override this, such as when using an
Expo tunnel. The tunnel forwards Metro only; Firebase still needs a LAN or VPN
host reachable from the phone.

If Metro's host is unavailable, the app defaults to `10.0.2.2` on Android and
`localhost` on iOS. Android also maps Metro's loopback host to `10.0.2.2`.

After changing the backend flag or emulator host, restart Expo and fully close
and reopen the app. Switching between cloud and emulator backends signs you
out and clears cached Firestore data and pending writes.

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

Data is discarded when the emulators stop. The Emulator UI is available at
`http://localhost:4000`. To use another workflow, follow the Test State steps below.

### Manual Startup

To run the pieces separately, use three terminals.

#### 1. Firebase

Build the Functions, then start the emulators:

```bash
cd server/functions
npm run build
cd ..
firebase emulators:start
```

The Emulator UI is available at `http://localhost:4000`.

#### 2. Expo

```bash
cd client
npm start
```

Open the installed development build through the Expo QR code.

### Test State

Run commands from `scripts/`. Clear existing data before switching workflows:

```bash
cd scripts
npm run seed:clear
```

All workflows use `dev@test.com` as the main account and `opponent@test.com`
as the opponent. Both use password `password123`. After clearing Auth,
reseed and relaunch the app; stale sessions are signed out automatically.

## Workflows

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
