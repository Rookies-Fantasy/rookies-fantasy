# Hosted Firestore utilities

These scripts import or update real database records. For local development,
use the [emulator workflow](../emulator/README.md).

## Setup

Install dependencies and run commands from `scripts/`:

```sh
cd scripts
npm ci
```

1. Place the target project's service-account key at `scripts/serviceAccountKey.json`.
   Confirm its `project_id` and unset `FIRESTORE_EMULATOR_HOST` to target hosted Firestore.
2. For NBA team and player imports, set `BALLDONTLIE_API_KEY` in `scripts/.env`
   or the shell environment.
3. Run `npm run <command>` using a command below.

Credentials and `.env*` files are ignored by Git.

## Reference data and metadata

| Command                     | Action                                                                         |
| --------------------------- | ------------------------------------------------------------------------------ |
| `hosted:teams`              | Import active NBA teams from BallDontLie.                                      |
| `hosted:players`            | Import active NBA player profiles and searchable names.                        |
| `hosted:team-abbreviations` | Copy abbreviations from `nbaTeams` onto matching players.                      |
| `hosted:salaries`           | Overwrite salaries using each player's stored `averageStats.fantasyPoints`.    |
| `hosted:augments:fill`      | Insert the augment catalogue with timestamps and player counts.                |
| `hosted:augments:update`    | Update augments whose titles match the catalogue.                              |
| `hosted:headshots:export`   | Export player IDs and `headshotURL` values to JSON, with a timestamped backup. |
| `hosted:headshots:import`   | Apply the JSON map to matching players; empty values clear their headshots.    |

`hosted:teams`, `hosted:players`, and `hosted:augments:fill` create new documents;
rerunning them can add duplicates. Headshot commands use
`scripts/hosted/data/nbaPlayerHeadshots.json`.

## Backfills

Run these when the target database needs the corresponding fields populated.

| Command                           | Action                                                                |
| --------------------------------- | --------------------------------------------------------------------- |
| `hosted:backfill:player-names`    | Recompute lowercase player search fields.                             |
| `hosted:backfill:player-averages` | Copy `nbaPlayerAverages` records into players missing `averageStats`. |
| `hosted:backfill:team-records`    | Add zeroed win/loss/draw records to teams missing a record.           |
