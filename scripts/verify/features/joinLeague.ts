import { ensureAuthUser } from "../../emulator/fixtures/users.js";
import { SEED_ACCOUNTS, SEED_PASSWORD } from "../core/config.js";
import { type Actor, SIGNED_OUT, callCallable } from "../core/http.js";
import { type JsonValue, getNumber, getStringArray } from "../core/json.js";
import {
  type CaseOutcome,
  type Feature,
  type FeatureContext,
  allOf,
  check,
  expectCallableError,
  readDoc,
  stageLeagueTeam,
} from "./support.js";

// The app opens the join screen from the invite link
// /joinLeague?leagueId=<id>, then submits the new team through joinLeague.
const ENTRY_POINT = "joinLeague (invite link join screen submit)";

const FULL = "emulator-league-full";
const OPEN = "emulator-league-open";
const OUTSIDER_EMAIL = "verify-outsider@test.com";

const memberCount = (league: JsonValue): number | null =>
  getNumber(league, "memberCount");

// Runs a join that must be rejected, and proves the league didn't change.
const expectRejected = async (
  context: FeatureContext,
  leagueId: string,
  teamId: string,
  sender: Actor,
  preconditions: string[],
  status: string,
  message: string,
): Promise<CaseOutcome> => {
  const path = `leagues/${leagueId}`;
  const before = await readDoc(context.db, path);
  const exchange = await callCallable(
    "joinLeague",
    { leagueId, teamId },
    sender,
  );
  const after = await readDoc(context.db, path);

  return {
    check: allOf(
      expectCallableError(exchange, status, message),
      check(
        JSON.stringify(before) === JSON.stringify(after),
        before === null
          ? `${path} still does not exist`
          : `${path} unchanged (memberCount ${memberCount(after)})`,
      ),
    ),
    preconditions,
    exchanges: [exchange],
    state: { [`${path} before`]: before, [`${path} after`]: after },
  };
};

export const joinLeague: Feature = {
  id: "join-league",
  title: "Join a league from an invite link",
  cases: [
    {
      id: "joins-open-league",
      title: "A new member joins an open league",
      entryPoint: ENTRY_POINT,
      expected: `200; leagues/${OPEN} memberCount 2 -> 3 with the new team and user`,
      run: async ({ db, seed, actor }) => {
        const teamId = "verify-join-team";
        const preconditions = [
          await stageLeagueTeam(db, seed.userId, teamId, "Verify Join Team"),
        ];
        const before = await readDoc(db, `leagues/${OPEN}`);
        const exchange = await callCallable(
          "joinLeague",
          { leagueId: OPEN, teamId },
          await actor(SEED_ACCOUNTS.user),
        );
        const after = await readDoc(db, `leagues/${OPEN}`);

        return {
          check: allOf(
            check(
              exchange.response.status === 200,
              `${exchange.response.status}`,
            ),
            check(
              memberCount(before) === 2 &&
                memberCount(after) === 3 &&
                getStringArray(after, "teamIds").includes(teamId) &&
                getStringArray(after, "userIds").includes(seed.userId),
              `stored memberCount ${memberCount(before)} -> ${memberCount(after)}, team ${getStringArray(after, "teamIds").includes(teamId) ? "added" : "missing"}, user ${getStringArray(after, "userIds").includes(seed.userId) ? "added" : "missing"}`,
            ),
          ),
          preconditions,
          exchanges: [exchange],
          state: {
            [`leagues/${OPEN} before`]: before,
            [`leagues/${OPEN} after`]: after,
          },
        };
      },
    },
    {
      id: "rejects-second-team-same-user",
      title: "A member can't join again with another team",
      entryPoint: ENTRY_POINT,
      expected: "ALREADY_EXISTS: User already joined; league unchanged",
      run: async (context) => {
        const preconditions = [
          await stageLeagueTeam(
            context.db,
            context.seed.opponentId,
            "verify-second-team",
            "Second Team",
          ),
          `${SEED_ACCOUNTS.opponent} already belongs to ${OPEN}`,
        ];
        return expectRejected(
          context,
          OPEN,
          "verify-second-team",
          await context.actor(SEED_ACCOUNTS.opponent),
          preconditions,
          "ALREADY_EXISTS",
          "User already joined",
        );
      },
    },
    {
      id: "rejects-team-already-in-league",
      title: "A team ID already in the league is rejected",
      entryPoint: ENTRY_POINT,
      expected: "ALREADY_EXISTS: Team already joined; league unchanged",
      run: async (context) => {
        const teamId = `${OPEN}-member-1`;
        const [, memberTwoId] = context.seed.memberIds;
        const preconditions = [
          await stageLeagueTeam(
            context.db,
            memberTwoId,
            teamId,
            "Copied Team ID",
          ),
          `${teamId} is already in ${OPEN} (owned by ${SEED_ACCOUNTS.memberOne})`,
        ];
        return expectRejected(
          context,
          OPEN,
          teamId,
          await context.actor(SEED_ACCOUNTS.memberTwo),
          preconditions,
          "ALREADY_EXISTS",
          "Team already joined",
        );
      },
    },
    {
      id: "rejects-full-league",
      title: "Joining a full league is rejected",
      entryPoint: ENTRY_POINT,
      expected: `RESOURCE_EXHAUSTED: League is full; leagues/${FULL} unchanged`,
      run: async (context) => {
        const outsider = await ensureAuthUser(context.auth, {
          email: OUTSIDER_EMAIL,
          password: SEED_PASSWORD,
        });
        const preconditions = [
          `auth user ${OUTSIDER_EMAIL}, in no league`,
          await stageLeagueTeam(
            context.db,
            outsider.uid,
            "verify-outsider-team",
            "Outsider Team",
          ),
          `${FULL} has 4 of 4 members`,
        ];
        return expectRejected(
          context,
          FULL,
          "verify-outsider-team",
          await context.actor(OUTSIDER_EMAIL),
          preconditions,
          "RESOURCE_EXHAUSTED",
          "League is full",
        );
      },
    },
    {
      id: "rejects-unknown-league",
      title: "An invite link to a league that doesn't exist is rejected",
      entryPoint: ENTRY_POINT,
      expected: "NOT_FOUND: League not found",
      run: async (context) => {
        const preconditions = [
          await stageLeagueTeam(
            context.db,
            context.seed.userId,
            "verify-lost-team",
            "Lost Team",
          ),
          "no league has the ID verify-missing-league",
        ];
        return expectRejected(
          context,
          "verify-missing-league",
          "verify-lost-team",
          await context.actor(SEED_ACCOUNTS.user),
          preconditions,
          "NOT_FOUND",
          "League not found",
        );
      },
    },
    {
      id: "rejects-someone-elses-team",
      title: "A team belonging to another user is rejected",
      entryPoint: ENTRY_POINT,
      expected:
        "NOT_FOUND: Team not found for the signed-in user; league unchanged",
      run: async (context) =>
        expectRejected(
          context,
          OPEN,
          `${OPEN}-opponent`,
          await context.actor(SEED_ACCOUNTS.memberTwo),
          [`${OPEN}-opponent belongs to ${SEED_ACCOUNTS.opponent}`],
          "NOT_FOUND",
          "Team not found for the signed-in user",
        ),
    },
    {
      id: "rejects-signed-out",
      title: "A signed-out request is rejected",
      entryPoint: ENTRY_POINT,
      expected:
        "UNAUTHENTICATED: You must be signed in to join a league; league unchanged",
      run: async (context) =>
        expectRejected(
          context,
          OPEN,
          "verify-join-team",
          SIGNED_OUT,
          [],
          "UNAUTHENTICATED",
          "You must be signed in to join a league",
        ),
    },
  ],
};
