# Firebase Emulator Setup Plan (Auth · Firestore · Functions)

Status: **Implemented on `feature/eng-109-league-standings` (not yet committed).** Remaining work is the manual/testing steps below.

Goal: run a local Firebase emulator suite (Authentication, Firestore, Functions) with the
React Native Firebase client, reachable from a physical device over Tailscale, with clean
persistence isolation when switching between the emulator and a cloud Firebase project.

---

## Current state

### Client (`client/`)
- Uses `@react-native-firebase/auth`, `/firestore`. 
**`@react-native-firebase/functions` is not installed and will not be added** (see decision below).
- Firebase auto-initializes from the **native** config files (`GoogleService-Info-*.plist` / `google-services-*.json`), selected per-environment in `app.config.ts`. There is **no central JS Firebase init module**; controllers call `firestore()` / `auth()` directly.
- Cloud Functions are **not** called via the `functions()` SDK. They are called via **hardcoded HTTPS `fetch`** to `cloudfunctions.net` in `controllers/ballDontLieController.ts`.

### Server (`server/`)
- `firebase.json` **already defines emulators** for functions (5001), firestore (8080), and UI (4000), all bound to `0.0.0.0` (good for Tailscale). **Auth emulator is missing.**
- Functions are v1: `https.onRequest`, `auth.user().onCreate` (`createUserInDatabase`), `pubsub`, plus scheduled/firestore triggers. `admin.initializeApp()` auto-detects the emulator via env vars — no change needed there.
- Default project: `rookies-fantasy-development`.

---

## Decisions

- **Functions:** keep the existing `onRequest` handlers and raw `fetch`; only make the base URL configurable. **Do NOT add `@react-native-firebase/functions`.** No backend `onCall` conversion.
- This means the backend is untouched except for `firebase.json`.

---

## Plan

### Server (`server/`)
1. ✅ Added an `auth` emulator (port `9099`) to `firebase.json`.
2. ✅ `serve` script now runs `firebase emulators:start --import ../emulator-data --export-on-exit ../emulator-data` (npm cwd is `server/functions/`, so `../emulator-data` resolves to `server/emulator-data`, next to `firebase.json`). Persists emulator data across restarts (Layer A). `server/emulator-data/` is gitignored.
3. ✅ Wired `firestore.rules` into `firebase.json` (top-level `"firestore": { "rules": "firestore.rules" }`). The rules in `server/firestore.rules` were pulled from the deployed `rookies-fantasy-development` project, so the emulator enforces the same rules as production. Keep in sync via `firebase deploy --only firestore:rules`.

### Client (`client/`)
4. New `firebase/config.ts`:
   - Reads `EXPO_PUBLIC_USE_EMULATOR` and `EXPO_PUBLIC_EMULATOR_HOST`.
   - When enabled, wires **auth + firestore** emulators before any controller runs:
     - `connectAuthEmulator(getAuth(), "http://${host}:9099")`
     - `connectFirestoreEmulator(getFirestore(), host, 8080)`
   - Runs the persistence mode-guard (see Layer B).
   - Imported once at the top of the root `app/_layout`.
5. ATS exception in `app.config.ts` `ios.infoPlist`, **gated to `development` only** so it never ships to preview/production. Prefer scoped exceptions over `NSAllowsArbitraryLoads`:
   - `NSAllowsLocalNetworking: true`
   - `NSExceptionDomains` entry for the Tailscale host (or `ts.net` MagicDNS name) allowing insecure HTTP loads.
6. Function base-URL helper (in `firebase/config.ts` or a `utils` file). Replace the hardcoded constants in `controllers/ballDontLieController.ts`:
   - Cloud: `https://us-central1-rookies-fantasy-development.cloudfunctions.net/<fn>`
   - Emulator: `http://${EXPO_PUBLIC_EMULATOR_HOST}:5001/rookies-fantasy-development/us-central1/<fn>`
   - Emulator URL is plain HTTP, covered by the same ATS exception. Raw `fetch` + manual `getIdToken()` / `Authorization: Bearer` header stays as-is.

### Environment variables (`.env`, never committed)
- `EXPO_PUBLIC_USE_EMULATOR=true`
- `EXPO_PUBLIC_EMULATOR_HOST=<your Tailscale IP, e.g. 100.x.y.z>`

---

## Tailscale + iOS ATS
- Both the dev machine and the physical device must be on the same tailnet.
- Emulators bind `0.0.0.0`, so the device reaches them at the machine's Tailscale IP.
- Emulator traffic is cleartext HTTP; the development-only ATS exception (step 5) unblocks it on iOS.
- Expo's Metro dev server also needs to be reachable over Tailscale — start it bound to the Tailscale IP (or use a tunnel).

---

## Persistence isolation (two separate layers)

### Layer A — Emulator server data
Handled by `--import/--export-on-exit` (server step 2). The emulator keeps its own dataset across restarts.

### Layer B — Client-side cache/session bleed
RN Firebase keeps a **local Firestore cache (SQLite)** and a **persisted auth session** on-device, keyed to the app, not to which backend it last pointed at. Switching emulator↔cloud in the same dev build reuses the same store, so data/sessions bleed across.

**Mode guard at startup, in `firebase/config.ts`:**
1. Compute current mode: `"emulator"` or `"cloud"`.
2. Read the last mode from `AsyncStorage`.
3. If the mode **changed**:
   - `await getAuth().signOut()`
   - Firestore `terminate()` + `clearPersistence()` (must run before any read/write)
   - store the new mode
4. If the mode **unchanged**: do nothing — persistence is retained normally.

Result: cloud keeps its cache/session, emulator keeps its own, and neither carries into the other. `clearPersistence()` only works while Firestore is un-started, which is why this lives in the init module imported before any controller.

---

## Testing the connection (EAS dev build ↔ emulator over Tailscale)

Test from the outside in — each layer rules out a class of failure before involving the app.

1. **Tailnet reachability.** `tailscale status` on both machine and device; they must list each other. Note the machine's `100.x.y.z` (or its `<machine>.<tailnet>.ts.net` MagicDNS name).
2. **Emulators are up locally.** Run `npm run serve` from `server/functions/`. Open `http://localhost:4000` on the machine — the Emulator Suite UI should load, listing Auth, Firestore, Functions. Startup logs should show each emulator bound to `0.0.0.0`.
3. **Ports reachable from the phone (the key smoke test).** In Safari on the device, open `http://100.x.y.z:4000`. If the Emulator UI loads, Tailscale + ports + firewall all work end-to-end — *before* the app is involved. (`:8080` returns `Ok` for Firestore; `:9099` returns JSON for Auth.) If this fails, it's almost always **Windows Firewall** — allow inbound on `4000/5001/8080/9099` (or allow `node`/`java`), and make sure the Tailscale adapter is on a Private network profile.
4. **Metro reachable.** The dev build loads JS from Metro on the machine, which also must be reachable over the tailnet. Start Expo with the packager host set to the Tailscale IP (`REACT_NATIVE_PACKAGER_HOSTNAME=100.x.y.z npx expo start`) or use `--tunnel`. In the dev launcher on the device, connect to `http://100.x.y.z:8081`.
5. **Confirm the app is actually on the emulator.** Sign up / write data in the app, then watch it appear live in the Emulator UI (Auth and Firestore tabs) at `http://100.x.y.z:4000`. That is the definitive proof of connection. Trigger a function (e.g. live data) and watch the request land in the Functions emulator logs.

**Gotchas specific to this setup**
- `EXPO_PUBLIC_*` are inlined **at bundle time**, and the ATS `NSExceptionDomains` entry for the host is baked into the native binary **at `eas build` time**. So `EXPO_PUBLIC_EMULATOR_HOST` must be set *before* the EAS build for the scoped ATS exception to include it; changing the host later needs a rebuild. `NSAllowsLocalNetworking` is a partial fallback but is not guaranteed to cover Tailscale's `100.64.0.0/10` (CGNAT) range — the scoped domain entry is what reliably permits it.
- Consider using the stable `*.ts.net` **MagicDNS name** instead of the raw IP for `EXPO_PUBLIC_EMULATOR_HOST` — it's a domain (cleaner ATS exception) and doesn't change.
- ATS symptom if misconfigured: requests fail with *"App Transport Security policy requires the use of a secure connection."*
- Auth-emulator symptom: Google Sign-In fails (expected — see below); use email/password.

---

## Future hardening (not adopting now)

- **`demo-*` project ID.** A project ID prefixed `demo-` (e.g. `demo-rookies-fantasy`) makes the emulator fully offline: no credentials, and the SDK **can't** reach production even if misconfigured — a hard guarantee on top of the Layer B mode-guard, and the recommended setup for CI. Not adopted now because it requires (a) an emulator-specific native config file carrying the demo project ID, (b) deriving the Functions URL project segment dynamically instead of hardcoding `rookies-fantasy-development`, and (c) seeding data via a script (can't import from a real-project export). **Current approach stays: real project `rookies-fantasy-development` + mode-guard.**

---

## Things to flag
- **Google Sign-In will not work against the Auth emulator** (no real Google OAuth). Use email/password test accounts, or seed users via the emulator import. The `signInWithGoogle` path is effectively cloud-only.
- **`createUserInDatabase` is an `auth.user().onCreate` trigger** — it only fires in-emulator when both the auth and functions emulators run together.
- Consider a **Firestore seed script** in `scripts/` for a known starting state each session.
- `firebase.json` lives in `server/` — run `firebase emulators:start` from there. Document the **two-terminal dev flow** (emulators in `server/`, Expo in `client/`).
- **Do not hardcode the Tailscale IP** in committed files — keep it in `.env`.

---

## File-change summary

| Area | File | Change | Status |
| --- | --- | --- | --- |
| Server | `server/firebase.json` | Auth emulator (9099) + top-level `firestore.rules` wiring | ✅ |
| Server | `server/firestore.rules` | New — rules pulled from deployed `rookies-fantasy-development` | ✅ |
| Server | `server/functions/package.json` | `serve` uses `--import/--export-on-exit ../emulator-data` | ✅ |
| Server | `server/.gitignore` | Ignore `emulator-data/` | ✅ |
| Client | `client/firebase/config.ts` | New — emulator wiring, base-URL helper, mode guard | ✅ |
| Client | `client/app/_layout.tsx` | Await `initFirebase()` before rendering the tree | ✅ |
| Client | `client/app.config.ts` | Dev-only ATS exception in `ios.infoPlist` | ✅ |
| Client | `client/controllers/ballDontLieController.ts` | Use configurable function base URL | ✅ |
| Client | `client/.env` | `EXPO_PUBLIC_USE_EMULATOR`, `EXPO_PUBLIC_EMULATOR_HOST` | ⛔ manual (yours) |
