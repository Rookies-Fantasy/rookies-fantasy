import { SEED_ACCOUNTS } from "../core/config.js";
import { SIGNED_OUT, getFunction } from "../core/http.js";
import {
  type JsonValue,
  getField,
  getNumber,
  getString,
} from "../core/json.js";
import { type Feature, check, readDoc } from "./support.js";

const ENTRY_POINT = "getLeagueStandings (league screen standings)";

const FULL = "emulator-league-full";
const OPEN = "emulator-league-open";

// The records seeded by the league-ready scenario, as "wins-losses-draws".
const EXPECTED_RECORDS: Record<string, string> = {
  [`${FULL}-opponent`]: "5-1-0",
  [`${FULL}-user`]: "4-2-0",
  [`${FULL}-member-1`]: "2-3-1",
  [`${FULL}-member-2`]: "1-5-0",
};

const readRecords = (body: JsonValue): Record<string, string> => {
  const teams = getField(body, "teams");
  const records: Record<string, string> = {};

  if (Array.isArray(teams)) {
    for (const team of teams) {
      const record = getField(team, "record");
      records[getString(team, "id")] = [
        getNumber(record, "wins"),
        getNumber(record, "losses"),
        getNumber(record, "draws"),
      ].join("-");
    }
  }

  return records;
};

const describeRecords = (records: Record<string, string>): string =>
  Object.entries(records)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, record]) => `${id.replace(`${FULL}-`, "")} ${record}`)
    .join(", ");

const sameRecords = (
  actual: Record<string, string>,
  expected: Record<string, string>,
): boolean =>
  Object.keys(actual).length === Object.keys(expected).length &&
  Object.entries(expected).every(([id, record]) => actual[id] === record);

export const leagueStandings: Feature = {
  id: "league-standings",
  title: "League standings",
  cases: [
    {
      id: "member-sees-standings",
      title: "A member sees every team's record",
      entryPoint: ENTRY_POINT,
      expected: `200 with 4 teams: ${describeRecords(EXPECTED_RECORDS)}`,
      run: async ({ db, actor }) => {
        const exchange = await getFunction(
          "getLeagueStandings",
          { leagueId: FULL },
          await actor(SEED_ACCOUNTS.user),
        );
        const records = readRecords(exchange.response.body);
        return {
          check: check(
            exchange.response.status === 200 &&
              sameRecords(records, EXPECTED_RECORDS),
            `${exchange.response.status} with ${Object.keys(records).length} teams: ${describeRecords(records)}`,
          ),
          preconditions: [`${SEED_ACCOUNTS.user} is a member of ${FULL}`],
          exchanges: [exchange],
          state: { [`leagues/${FULL}`]: await readDoc(db, `leagues/${FULL}`) },
        };
      },
    },
    {
      id: "non-member-forbidden",
      title: "A user outside the league is refused",
      entryPoint: ENTRY_POINT,
      expected: "403 Forbidden",
      run: async ({ actor }) => {
        const exchange = await getFunction(
          "getLeagueStandings",
          { leagueId: OPEN },
          await actor(SEED_ACCOUNTS.user),
        );
        return {
          check: check(
            exchange.response.status === 403 &&
              exchange.response.body === "Forbidden",
            `${exchange.response.status} ${JSON.stringify(exchange.response.body)}`,
          ),
          preconditions: [`${SEED_ACCOUNTS.user} is not a member of ${OPEN}`],
          exchanges: [exchange],
          state: {},
        };
      },
    },
    {
      id: "signed-out-unauthorized",
      title: "A signed-out request is refused",
      entryPoint: ENTRY_POINT,
      expected: "401 Unauthorized",
      run: async () => {
        const exchange = await getFunction(
          "getLeagueStandings",
          { leagueId: FULL },
          SIGNED_OUT,
        );
        return {
          check: check(
            exchange.response.status === 401 &&
              exchange.response.body === "Unauthorized",
            `${exchange.response.status} ${JSON.stringify(exchange.response.body)}`,
          ),
          preconditions: [],
          exchanges: [exchange],
          state: {},
        };
      },
    },
    {
      id: "unknown-league-not-found",
      title: "A league that doesn't exist answers 404",
      entryPoint: ENTRY_POINT,
      expected: "404 League not found",
      run: async ({ actor }) => {
        const exchange = await getFunction(
          "getLeagueStandings",
          { leagueId: "verify-missing-league" },
          await actor(SEED_ACCOUNTS.user),
        );
        return {
          check: check(
            exchange.response.status === 404 &&
              exchange.response.body === "League not found",
            `${exchange.response.status} ${JSON.stringify(exchange.response.body)}`,
          ),
          preconditions: ["no league has the ID verify-missing-league"],
          exchanges: [exchange],
          state: {},
        };
      },
    },
    {
      id: "malformed-id-rejected",
      title: "A malformed league ID answers 400",
      entryPoint: ENTRY_POINT,
      expected: "400 Invalid request: leagueId is missing or malformed",
      run: async ({ actor }) => {
        const exchange = await getFunction(
          "getLeagueStandings",
          { leagueId: "not/an-id" },
          await actor(SEED_ACCOUNTS.user),
        );
        return {
          check: check(
            exchange.response.status === 400 &&
              exchange.response.body ===
                "Invalid request: leagueId is missing or malformed",
            `${exchange.response.status} ${JSON.stringify(exchange.response.body)}`,
          ),
          preconditions: [],
          exchanges: [exchange],
          state: {},
        };
      },
    },
  ],
};
