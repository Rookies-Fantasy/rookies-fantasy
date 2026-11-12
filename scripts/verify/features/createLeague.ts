import { SEED_ACCOUNTS } from "../core/config.js";
import {
  type Actor,
  type Exchange,
  SIGNED_OUT,
  callCallable,
  callableResult,
} from "../core/http.js";
import {
  type JsonObject,
  getField,
  getNumber,
  getString,
  getStringArray,
} from "../core/json.js";
import {
  type CaseOutcome,
  type Feature,
  type FeatureContext,
  allOf,
  check,
  countLeagues,
  expectCallableError,
  readDoc,
  stageLeagueTeam,
} from "./support.js";

const ENTRY_POINT = "createLeague (create-league form submit)";
const TEAM_ID = "verify-create-team";

const validInput = (overrides: JsonObject): JsonObject => ({
  name: "Verify League",
  numberOfTeams: 6,
  budget: 150_000_000,
  initialTeamId: TEAM_ID,
  ...overrides,
});

// Runs a create that must be rejected, and proves no league was written.
const expectRejected = async (
  context: FeatureContext,
  input: JsonObject,
  sender: Actor,
  status: string,
  message: string,
): Promise<CaseOutcome> => {
  const preconditions = [
    await stageLeagueTeam(
      context.db,
      context.seed.userId,
      TEAM_ID,
      "Verify Team",
    ),
  ];
  const before = await countLeagues(context.db);
  const exchange = await callCallable("createLeague", input, sender);
  const after = await countLeagues(context.db);

  return {
    check: allOf(
      expectCallableError(exchange, status, message),
      check(before === after, `league count ${before} -> ${after}`),
    ),
    preconditions,
    exchanges: [exchange],
    state: { leagueCountBefore: before, leagueCountAfter: after },
  };
};

const createdLeagueId = (exchange: Exchange): string =>
  getString(getField(callableResult(exchange), "league"), "id");

export const createLeague: Feature = {
  id: "create-league",
  title: "Create a league",
  cases: [
    {
      id: "creates-league",
      title:
        "A valid form creates the league with the creator as its only member",
      entryPoint: ENTRY_POINT,
      expected:
        "200; the response and leagues/{id} both hold 1 member: the creator and their team",
      run: async (context) => {
        const { db, seed, actor } = context;
        const preconditions = [
          await stageLeagueTeam(db, seed.userId, TEAM_ID, "Verify Team"),
        ];
        const exchange = await callCallable(
          "createLeague",
          validInput({}),
          await actor(SEED_ACCOUNTS.user),
        );
        const league = getField(callableResult(exchange), "league");
        const leagueId = createdLeagueId(exchange);
        const stored =
          leagueId.length > 0 ? await readDoc(db, `leagues/${leagueId}`) : null;

        const holdsCreator = (value: typeof stored): boolean =>
          getNumber(value, "memberCount") === 1 &&
          getNumber(value, "numberOfTeams") === 6 &&
          getNumber(value, "budget") === 150_000_000 &&
          getString(value, "name") === "Verify League" &&
          getStringArray(value, "teamIds").join() === TEAM_ID &&
          getStringArray(value, "userIds").join() === seed.userId;

        return {
          check: allOf(
            check(
              exchange.response.status === 200 && holdsCreator(league),
              `${exchange.response.status}, response memberCount ${getNumber(league, "memberCount")}`,
            ),
            check(
              holdsCreator(stored) &&
                getString(stored, "creatorUserId") === seed.userId,
              stored === null
                ? "no league document written"
                : `stored leagues/${leagueId} creator ${getString(stored, "creatorUserId") === seed.userId ? "is" : "is not"} ${SEED_ACCOUNTS.user}`,
            ),
          ),
          preconditions,
          exchanges: [exchange],
          state: { [`leagues/${leagueId}`]: stored },
        };
      },
    },
    {
      id: "rejects-off-step-team-count",
      title: "A team count off the stepper is rejected",
      entryPoint: ENTRY_POINT,
      expected:
        "INVALID_ARGUMENT: Number of teams must be between 4 and 20, in steps of 2; no league written",
      run: async (context) =>
        expectRejected(
          context,
          validInput({ numberOfTeams: 5 }),
          await context.actor(SEED_ACCOUNTS.user),
          "INVALID_ARGUMENT",
          "Number of teams must be between 4 and 20, in steps of 2",
        ),
    },
    {
      id: "rejects-off-step-budget",
      title: "A budget off the stepper is rejected",
      entryPoint: ENTRY_POINT,
      expected:
        "INVALID_ARGUMENT: Budget must be between 150000000 and 250000000, in steps of 25000000; no league written",
      run: async (context) =>
        expectRejected(
          context,
          validInput({ budget: 160_000_000 }),
          await context.actor(SEED_ACCOUNTS.user),
          "INVALID_ARGUMENT",
          "Budget must be between 150000000 and 250000000, in steps of 25000000",
        ),
    },
    {
      id: "rejects-blank-name",
      title: "A blank league name is rejected",
      entryPoint: ENTRY_POINT,
      expected: "INVALID_ARGUMENT: League name is required; no league written",
      run: async (context) =>
        expectRejected(
          context,
          validInput({ name: "   " }),
          await context.actor(SEED_ACCOUNTS.user),
          "INVALID_ARGUMENT",
          "League name is required",
        ),
    },
    {
      id: "rejects-someone-elses-team",
      title: "A team belonging to another user is rejected",
      entryPoint: ENTRY_POINT,
      expected:
        "NOT_FOUND: Team not found for the signed-in user; no league written",
      run: async (context) =>
        expectRejected(
          context,
          validInput({ initialTeamId: "emulator-league-open-opponent" }),
          await context.actor(SEED_ACCOUNTS.user),
          "NOT_FOUND",
          "Team not found for the signed-in user",
        ),
    },
    {
      id: "rejects-signed-out",
      title: "A signed-out request is rejected",
      entryPoint: ENTRY_POINT,
      expected:
        "UNAUTHENTICATED: You must be signed in to create a league; no league written",
      run: async (context) =>
        expectRejected(
          context,
          validInput({}),
          SIGNED_OUT,
          "UNAUTHENTICATED",
          "You must be signed in to create a league",
        ),
    },
  ],
};
