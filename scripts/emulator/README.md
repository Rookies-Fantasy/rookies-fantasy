# Firebase Emulator Quick Start

This tooling creates repeatable local states for drafting, matchmaking, and
active matchups. The default password for every seeded account is
`password123`.

## One-Time Setup

Install:

- Node 22
- Java, required by the Firestore emulator
- Firebase CLI
- A development build of the mobile app
- Access to the development Firebase project and its Functions settings

Install dependencies from the repository root:

```bash
cd client
npm ci

cd ../server/functions
npm ci

cd ../../scripts
npm ci
```

Create the ignored file `client/.env.local`:

```dotenv
EXPO_PUBLIC_USE_EMULATOR=true
EXPO_PUBLIC_EMULATOR_HOST=192.168.x.x
```

For a physical phone, replace `192.168.x.x` with the development computer's
LAN IP. The phone and computer must be on the same reachable network. See
[Physical Phone Network Setup](#physical-phone-network-setup) if the phone
cannot connect.

When using an Android emulator or iOS simulator, omit
`EXPO_PUBLIC_EMULATOR_HOST`; the app defaults to `10.0.2.2` on Android and
`localhost` on iOS.

## Start the Environment

Use three terminals.

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

Open the installed development build through the Expo QR code. The client log
should confirm the emulator host it connected to.

### 3. Test State

Run scenario commands from `scripts/`. Clear existing data before switching
workflows:

```bash
cd scripts
npm run seed:clear
```

Choose a workflow:

| Workflow                  | Seed command               | Login          |
| ------------------------- | -------------------------- | -------------- |
| Draft a team              | `npm run seed:draft-ready` | `dev@test.com` |
| Test matchmaking          | `npm run seed:queue-ready` | `dev@test.com` |
| Advance a premade matchup | `npm run seed:scenario`    | `dev@test.com` |

All workflows use the same main login, `dev@test.com`, with password
`password123`. Opponent accounts use `opponent@test.com`. These defaults live
in `core/defaults.ts`. After clearing emulator Auth, sign out and sign back in
after reseeding.

## Workflow Notes

### Draft a Team

`seed:draft-ready` creates a registered user, an empty team with the full
`$150M` balance, and the NBA data needed by the draft screens. Sign in and
draft the team through the app.

Re-running the seed command restores the seeded team to its empty state.

### Test Matchmaking

`seed:queue-ready` creates two idle users with complete teams. Sign in as
`dev@test.com`, press **QUEUE**, then simulate the opponent joining:

```bash
npm run queue:opponent
```

The command only queues `opponent@test.com`. The local `processQueue`
Cloud Function performs the actual matchmaking and creates the matchup.

### Advance a Premade Matchup

`seed:scenario` creates two complete teams and an active matchup. New teams
and matchups receive generated Firestore IDs, which the command prints.
The IDs are stored on the user and team documents for follow-up commands.

Reseeding reuses each user's selected team when it still exists. An existing
active matchup between those teams is also reused, preserving its snapshots.
Completed matchups remain in history; the next seed creates a new matchup.

Simulate deterministic scores for today or the whole Monday-Sunday week:

```bash
npm run simulate:day
npm run simulate:week
```

Both commands skip dates that already have snapshots. Running the day command
before the week command, or rerunning either command, does not duplicate
scores.

Complete the main development user's current matchup and return its users to idle:

```bash
npm run seed:end-matchup
```

This command uses the same completion function as the scheduled weekly reset.
It totals the daily snapshot scores, updates team records, and clears the
participants' queue and matchup state in one transaction. Repeating completion
does not count the result twice; with no current matchup, the command does nothing.

## Optional Overrides

The default workflows do not require overrides. Use `cross-env` for portable
PowerShell, Command Prompt, and Unix syntax:

```bash
# Start from a chosen date
npx cross-env SIM_DATE=2026-08-11 npm run simulate:week

# Add at most three days
npx cross-env SIM_DAYS=3 npm run simulate:week

# Replace your-matchup-id with the ID printed by a seed command or the Emulator UI
npx cross-env MATCHUP_ID=your-matchup-id npm run simulate:day
npx cross-env MATCHUP_ID=your-matchup-id npm run seed:end-matchup
```

For custom logins, use `USER_EMAIL` for `seed:user`, `seed:draft-ready`, and
`seed:queue-ready`. Use `OPPONENT_EMAIL` for `seed:queue-ready` and
`queue:opponent`. The premade matchup uses `HOME_USER_EMAIL` and
`AWAY_USER_EMAIL`. `USER_PASSWORD` overrides the seeded password.

`queue:opponent` uses the opponent's selected team. `seed:end-matchup` uses
the main user's `currentMatchupId`, so normal workflows do not require copying
IDs. `USER_ID` or `USER_EMAIL` can select another user for completion;
`HOME_USER_EMAIL` is also supported for the premade scenario.

Use `TEAM_ID`, `USER_TEAM_ID`, `OPPONENT_TEAM_ID`, `HOME_TEAM_ID`,
`AWAY_TEAM_ID`, or `MATCHUP_ID` to explicitly target seed documents where
supported. Otherwise, seed commands reuse linked documents or generate IDs
when creating new ones. Simulation commands still target all active matchups
unless `MATCHUP_ID` is provided.

Lower-level commands such as `seed:user`, `seed:team`, and `seed:matchup` are
available for targeted setup, but the three scenarios above are the supported
MVP workflows.

`seed:user` creates a user with defaults on the first run. Reseeding the same
account updates its credentials and update time while preserving its selected
team, current matchup, queue state, profile, and creation time. Explicit fields
passed to the user fixture override existing values; scenario commands still
set their intended scenario state.

## Physical Phone Network Setup

Skip this section when using an Android emulator or iOS simulator. A physical
phone must be able to reach the development computer over the local network.
On a phone, `localhost` refers to the phone itself, not the computer running the
Firebase emulators. The app therefore connects to the emulators through the
computer's LAN IP, and Windows may block that inbound traffic unless Node,
Java, or the required ports are allowed. Restricting access to the private
network keeps the emulators unavailable on public networks.

### Windows: Recommended Setup

1. Make sure the phone and computer are connected to the same Wi-Fi network.
2. Run `ipconfig` in PowerShell and find the IPv4 address for the active Wi-Fi
   or Ethernet adapter. Do not use `127.0.0.1`.
3. Put that address in `client/.env.local` as
   `EXPO_PUBLIC_EMULATOR_HOST`.
4. Set the Windows network to **Private** under **Settings > Network &
   internet > Wi-Fi (or Ethernet) > the connected network > Network profile**.
5. Start Firebase and Expo. If Windows asks for firewall access, allow Node.js
   and Java/OpenJDK on **Private networks** only.
6. If no prompt appears, open **Windows Security > Firewall & network
   protection > Allow an app through firewall** and confirm Node.js and
   Java/OpenJDK are allowed on **Private** networks.

Restart Firebase, Expo, and the mobile app after changing these settings. This
application-level access is normally all that is required.

### Windows: Manual Port Rules

Only use manual inbound rules if the recommended setup still does not work. You
do not need both approaches when application-level access succeeds.

Under **Windows Defender Firewall with Advanced Security > Inbound Rules > New
Rule > Port**, allow private-network TCP traffic for the following ports:

- Functions: `5001`
- Firestore: `8080`
- Auth: `9099`
- Expo/Metro: the port printed by Expo, commonly `8081`

Restrict the rules to the local subnet or the phone's IP when practical. Do not
enable them for public networks. Port `4000` is only needed if another device
must open the Emulator UI; the app itself does not use it.

### Verify the Connection

To verify connectivity, open `http://<computer-ip>:8080` on the phone. A
successful response means the phone can reach the Firestore emulator. If that
works but the app does not, confirm the same IP appears in the app's
`[Emulator] Connected` log message and restart Expo after editing `.env.local`.

On iOS, also allow the app's **Local Network** permission when prompted. On
macOS, allow incoming connections for Node and Java if the system requests it.

## Code Organization

- `data/` contains the default players, NBA teams, and augments.
- `generate/` builds documents and lineups without writing to Firebase.
- `fixtures/` contains reusable Auth and Firestore operations.
- `scenarios/` composes fixtures into meaningful application states.
- `commands/` provides terminal entry points and defaults.
- `core/` configures the emulator client, account defaults, and reset behavior.

Scenario Firestore writes are staged in a batch and committed together. Auth
users are created separately because Firebase Auth cannot participate in a
Firestore batch.

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
- **More inspection is needed:** Open the Emulator UI at
  `http://localhost:4000`.
