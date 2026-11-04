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
EXPO_PUBLIC_USE_EMULATOR=true
EXPO_PUBLIC_EMULATOR_HOST=192.168.x.x
```

For a physical phone, use the computer's LAN IP and connect both devices to
the same network. See [network setup](#physical-phone-network-setup) if needed.

When using an Android emulator or iOS simulator, omit
`EXPO_PUBLIC_EMULATOR_HOST`; the app defaults to `10.0.2.2` on Android and
`localhost` on iOS.

## Start the Environment

Open three terminals at the repository root.

### 1. Firebase

Build the Functions, then start the emulators:

```bash
cd server/functions
npm run build
cd ..
firebase emulators:start
```

The Emulator UI is available at `http://localhost:4000`.

### 2. Expo

```bash
cd client
npm start
```

Open the installed development build through the Expo QR code.

### 3. Test State

Run commands from `scripts/`. Clear existing data before switching workflows:

```bash
cd scripts
npm run seed:clear
```

All workflows use `dev@test.com` as the main account and `opponent@test.com`
as the opponent. Both use password `password123`. After clearing Auth,
sign out in the app, reseed, and sign back in.

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

1. Run `ipconfig` in PowerShell. Set `EXPO_PUBLIC_EMULATOR_HOST` in
   `client/.env.local` to the active adapter's LAN IPv4 address.
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

- **Phone cannot load data:** Confirm the LAN IP in
  `EXPO_PUBLIC_EMULATOR_HOST`, then review the network steps above.
- **Queue button is missing:** Confirm `EXPO_PUBLIC_USE_EMULATOR=true` and
  restart Expo after changing `.env.local`.
- **Users do not match:** Check the Functions log and confirm both users have
  complete teams.
- **Functions changes are stale:** Run `npm run build` from
  `server/functions/`, then restart the emulator.
- **Function secrets cannot load:** Run `firebase login` and confirm access to
  the development Firebase project.
- **The app shows an old state:** Reload the app after reseeding.
