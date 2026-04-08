# Firebase Emulator Setup

Guide for connecting the client app to the local Firebase emulator during development.

## Prerequisites

- Firebase emulator running (from `server/`):
  ```bash
  firebase emulators:start
  ```
- Emulator UI available at http://localhost:4000

---

## iOS Simulator

No extra configuration needed. The simulator runs on the same machine, so `localhost` works out of the box.

1. Create `client/.env.local`:
   ```
   EXPO_PUBLIC_USE_EMULATOR=true
   ```

2. Start Metro:
   ```bash
   cd client
   npx expo start
   ```

3. The app will connect to the emulator automatically. Look for this in Metro logs:
   ```
   [Emulator] Connected to Firebase emulators at localhost
   ```

---

## Physical Device

Your device and dev machine must be on the **same Wi-Fi network**.

### 1. Find your machine's LAN IP

Run `ipconfig` and look for the **IPv4 Address** under your active network adapter.

> **Windows gotcha:** Avoid `192.168.56.x` — that's a VirtualBox virtual adapter, not your real network. Match the adapter whose subnet matches your phone's IP (Settings > Wi-Fi > tap your network).

### 2. Configure the client

Create `client/.env.local`:
```
EXPO_PUBLIC_USE_EMULATOR=true
EXPO_PUBLIC_EMULATOR_HOST=192.168.x.x
```

Replace `192.168.x.x` with your actual LAN IP.

### 3. Windows Firewall (one-time setup)

**Step 1** — Set your network profile to Private (required for inbound connections). Run in **admin PowerShell**:
```powershell
Get-NetConnectionProfile | Select InterfaceAlias, NetworkCategory
```
If your adapter shows `Public`, change it:
```powershell
Set-NetConnectionProfile -InterfaceAlias "Ethernet" -NetworkCategory Private
```
Replace `"Ethernet"` with your adapter name from the output above.

**Step 2** — Open the emulator ports:
```powershell
New-NetFirewallRule -DisplayName "Firebase Auth Emulator" -Direction Inbound -Protocol TCP -LocalPort 9099 -Action Allow
New-NetFirewallRule -DisplayName "Firebase Firestore Emulator" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

**Verify** by opening these in your phone's browser — both should return a response (not time out):
- `http://192.168.x.x:9099`
- `http://192.168.x.x:8080`

### 4. iOS rebuild (first time only)

The app includes an ATS (App Transport Security) exception in `app.config.ts`:

```json
"NSAppTransportSecurity": {
  "NSAllowsLocalNetworking": true,
  "NSAllowsArbitraryLoads": true
}
```

`NSAllowsArbitraryLoads` is intentionally broad — it allows HTTP to any host, not just the emulator IP. This is necessary because iOS gRPC (used by Firestore) does not respect more targeted ATS exceptions. It is **only active when `APP_ENV=development`** and is never included in staging or production builds, so it carries no production security risk.

This is already configured — you just need to build once for it to take effect:

```bash
cd client
npx expo run:ios
# or via EAS:
eas build --profile development --platform ios
```

Subsequent JS changes (including `.env.local` updates) only require a Metro restart, not a full rebuild.

### 5. Start Metro

```bash
cd client
npx expo start
```

Look for this in Metro logs to confirm the connection:
```
[Emulator] Connected to Firebase emulators at 192.168.x.x
```

---

## Seeding Test Data

Run these from `scripts/` after the emulator is up:

```bash
# 1. Clear any existing data (optional)
npm run seed:clear

# 2. Inject NBA reference data
npm run seed:nba-teams
npm run seed:nba-players

# 3. Create a user (prints UID and credentials)
npm run seed:user
```

Default credentials:
- **Email:** `user-<id>@rookies.test`
- **Password:** `Test1234!`

The exact email is printed in the terminal after running `seed:user`.

To create additional users or matchups see the full seeding workflow in the [scripts README](../README.md) (if available) or run `npm run seed` for a list of all commands.
