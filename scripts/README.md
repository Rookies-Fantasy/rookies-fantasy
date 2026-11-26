# Scripts

Run commands from `scripts/`.

| Folder                            | Purpose                                                              | Commands                                        |
| --------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| [`emulator/`](emulator/README.md) | Disposable local Firebase data, app scenarios, and score simulations | `dev`, `seed:*`, `simulate:*`, `queue:opponent` |
| [`hosted/`](hosted/README.md)     | Hosted Firestore imports, metadata updates, and backfills            | `hosted:*`                                      |

## Local development

```sh
npm ci
npm run dev
```

The launcher builds Functions, starts the Firebase emulators, seeds a matchup,
and starts Expo. See the [emulator guide](emulator/README.md) for prerequisites,
other scenarios, and simulation commands.

## Hosted database maintenance

Follow the [hosted guide](hosted/README.md) to configure credentials, select the
target database, and run an import or backfill.

## Validation

Run `npm run typecheck` to check the emulator TypeScript.
The hosted utilities are JavaScript; `node --check hosted/<script>.js` checks
their syntax without running database operations.
