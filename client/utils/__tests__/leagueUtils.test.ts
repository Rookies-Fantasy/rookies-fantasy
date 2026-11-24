import { describe, expect, it } from "@jest/globals";
import { League } from "@/types/league";
import {
  BenchSlot,
  PlayerTeamDisplay,
  SlotPosition,
  TeamLineupSlot,
} from "@/types/team";
import {
  buildLeagueSettingsSchema,
  getBalanceForBudget,
  getMinEditableBudget,
  getOwnerTeamId,
  getRosterCost,
  isBudgetCoveringRoster,
  isLeagueBudgetLocked,
  MAX_BUDGET,
  MIN_BUDGET,
} from "@/utils/leagueUtils";

const M = 1_000_000;

const player = (id: string, salary: number): PlayerTeamDisplay => ({
  id,
  salary,
  firstName: "First",
  lastName: id,
  headshotUrl: "",
  positions: ["PG"],
  teamAbbreviation: "NBA",
});

const lineupSlot = (
  position: SlotPosition,
  salary: number | null,
): TeamLineupSlot => ({
  position,
  player: salary === null ? null : player(position, salary),
});

const benchSlot = (salary: number): BenchSlot => ({
  position: "BEN1",
  player: player("bench", salary),
});

const league = (overrides: Partial<League> = {}): League => ({
  id: "league-1",
  name: "League",
  creatorUserId: "owner",
  numberOfTeams: 4,
  budget: 150 * M,
  memberCount: 1,
  teamIds: ["owner-team"],
  userIds: ["owner"],
  ...overrides,
});

describe("getRosterCost", () => {
  it("adds up every salary in the lineup and on the bench", () => {
    const team = {
      lineup: [
        lineupSlot("PG", 25 * M),
        lineupSlot("SG", null),
        lineupSlot("C", 15 * M),
      ],
      bench: [benchSlot(10 * M)],
    };

    expect(getRosterCost(team)).toBe(50 * M);
  });

  it("is 0 for an empty roster", () => {
    expect(getRosterCost({ lineup: [lineupSlot("PG", null)], bench: [] })).toBe(
      0,
    );
  });
});

describe("getBalanceForBudget", () => {
  it("is the new budget minus what the roster costs", () => {
    const team = { lineup: [lineupSlot("PG", 40 * M)], bench: [] };
    expect(getBalanceForBudget(200 * M, team)).toBe(160 * M);
  });
});

describe("getMinEditableBudget", () => {
  it("is the minimum budget while the roster fits in it", () => {
    expect(getMinEditableBudget(0)).toBe(MIN_BUDGET);
    expect(getMinEditableBudget(150 * M)).toBe(MIN_BUDGET);
  });

  it("rounds up to the next step that pays for the roster", () => {
    expect(getMinEditableBudget(160 * M)).toBe(175 * M);
    expect(getMinEditableBudget(175 * M)).toBe(175 * M);
  });

  it("never goes past the maximum budget", () => {
    expect(getMinEditableBudget(300 * M)).toBe(MAX_BUDGET);
  });
});

describe("isBudgetCoveringRoster", () => {
  it("allows a budget equal to or above the roster cost", () => {
    expect(isBudgetCoveringRoster(150 * M, 150 * M)).toBe(true);
    expect(isBudgetCoveringRoster(175 * M, 150 * M)).toBe(true);
  });

  it("rejects a budget below the roster cost", () => {
    expect(isBudgetCoveringRoster(150 * M, 160 * M)).toBe(false);
  });
});

describe("buildLeagueSettingsSchema", () => {
  const values = (budget: number) => ({
    leagueName: "League",
    numberOfTeams: 4,
    budget,
  });

  it("rejects a budget below the roster cost with a clear message", async () => {
    const schema = buildLeagueSettingsSchema(4, 160 * M);

    await expect(schema.validate(values(150 * M))).rejects.toThrow(
      "Your roster costs $160M, so the budget can't be lower than that",
    );
  });

  it("accepts a budget that pays for the roster", async () => {
    const schema = buildLeagueSettingsSchema(4, 160 * M);
    await expect(schema.validate(values(175 * M))).resolves.toBeTruthy();
  });

  it("only applies the usual bounds when there is no roster", async () => {
    const schema = buildLeagueSettingsSchema();
    await expect(schema.validate(values(150 * M))).resolves.toBeTruthy();
  });
});

describe("isLeagueBudgetLocked", () => {
  it("is unlocked while the owner is the only member", () => {
    expect(isLeagueBudgetLocked(league())).toBe(false);
  });

  it("locks once another team has joined", () => {
    expect(
      isLeagueBudgetLocked(
        league({
          memberCount: 2,
          teamIds: ["owner-team", "other-team"],
          userIds: ["owner", "other"],
        }),
      ),
    ).toBe(true);
  });
});

describe("getOwnerTeamId", () => {
  it("is the league's only team", () => {
    expect(getOwnerTeamId(league())).toBe("owner-team");
  });

  it("is null when the league doesn't have exactly one team", () => {
    expect(getOwnerTeamId(league({ teamIds: [] }))).toBeNull();
    expect(getOwnerTeamId(league({ teamIds: ["a", "b"] }))).toBeNull();
  });
});
