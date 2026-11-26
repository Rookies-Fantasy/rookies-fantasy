import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { getDeadlineBounds, SeasonConfig } from "../../src/leagues/season";
import { LeagueDocument, UpdateLeagueInput } from "../../src/leagues/types";
import {
  evaluateDeleteEligibility,
  evaluateUpdateEligibility,
  validateUpdateLeagueInput,
} from "../../src/leagues/validation";

const SEASON: SeasonConfig = {
  season: "2026-27",
  startDate: "2026-10-20",
  endDate: "2027-04-11",
};
const TODAY = "2026-11-22";
const BOUNDS = getDeadlineBounds(SEASON, TODAY);
const OWNER = "owner";
const AFTER_LATEST_FOUR_TEAM_DEADLINE = "2027-03-10";

const cancelledLeague = (
  overrides: Partial<LeagueDocument> = {},
): LeagueDocument => ({
  name: "Short league",
  creatorUserId: OWNER,
  numberOfTeams: 4,
  budget: 150_000_000,
  memberCount: 3,
  teamIds: ["t1", "t2", "t3"],
  userIds: [OWNER, "u2", "u3"],
  teamOwners: { t1: OWNER, t2: "u2", t3: "u3" },
  deadline: "2026-11-21",
  status: "unscheduled",
  playoffTeams: null,
  regularSeasonWeeks: null,
  playoffStartWeek: null,
  ...overrides,
});

const updateOf = (
  league: LeagueDocument,
  overrides: Partial<UpdateLeagueInput> = {},
): UpdateLeagueInput => ({
  leagueId: "league",
  name: league.name,
  numberOfTeams: league.numberOfTeams,
  budget: league.budget,
  deadline: league.deadline,
  ...overrides,
});

const evaluate = (league: LeagueDocument, input: UpdateLeagueInput) =>
  evaluateUpdateEligibility(league, input, OWNER, TODAY, BOUNDS);

describe("validateUpdateLeagueInput", () => {
  const base = {
    leagueId: "league",
    name: "League",
    numberOfTeams: 4,
    budget: 150_000_000,
  };

  it("treats a missing deadline as unchanged", () => {
    const result = validateUpdateLeagueInput(base);
    assert.ok(result.valid);
    assert.equal(result.input.deadline, null);
  });

  it("accepts a YYYY-MM-DD deadline", () => {
    const result = validateUpdateLeagueInput({
      ...base,
      deadline: "2026-12-01",
    });
    assert.ok(result.valid);
    assert.equal(result.input.deadline, "2026-12-01");
  });

  it("rejects a malformed deadline", () => {
    const result = validateUpdateLeagueInput({ ...base, deadline: "Dec 1" });
    assert.equal(result.valid, false);
  });
});

describe("evaluateUpdateEligibility: registration deadline", () => {
  it("reopens a cancelled league when the deadline moves", () => {
    const result = evaluate(
      cancelledLeague(),
      updateOf(cancelledLeague(), { deadline: "2026-12-01" }),
    );
    assert.deepEqual(result, {
      allowed: true,
      deadline: "2026-12-01",
      status: "forming",
    });
  });

  it("lets a reopened league change its team count in the same save", () => {
    const league = cancelledLeague();
    const result = evaluate(
      league,
      updateOf(league, { deadline: "2026-12-01", numberOfTeams: 6 }),
    );
    assert.equal(result.allowed, true);
  });

  it("keeps a cancelled league cancelled on a rename", () => {
    const league = cancelledLeague();
    const result = evaluate(league, updateOf(league, { name: "Renamed" }));
    assert.deepEqual(result, {
      allowed: true,
      deadline: league.deadline,
      status: "unscheduled",
    });
  });

  it("keeps the team count locked while the league stays cancelled", () => {
    const league = cancelledLeague();
    const result = evaluate(league, updateOf(league, { numberOfTeams: 6 }));
    assert.equal(result.allowed, false);
    assert.equal(!result.allowed && result.code, "registration-closed");
  });

  it("moves the deadline of a forming league", () => {
    const league = cancelledLeague({
      status: "forming",
      deadline: "2026-11-30",
    });
    const result = evaluate(
      league,
      updateOf(league, { deadline: "2026-12-05" }),
    );
    assert.deepEqual(result, {
      allowed: true,
      deadline: "2026-12-05",
      status: "forming",
    });
  });

  it("rejects a deadline that isn't after today", () => {
    const league = cancelledLeague();
    const result = evaluate(league, updateOf(league, { deadline: TODAY }));
    assert.equal(!result.allowed && result.code, "invalid-deadline");
  });

  it("rejects a deadline past the latest one the season allows", () => {
    const league = cancelledLeague();
    const result = evaluate(
      league,
      updateOf(league, { deadline: AFTER_LATEST_FOUR_TEAM_DEADLINE }),
    );
    assert.equal(!result.allowed && result.code, "invalid-deadline");
  });

  it("reports a season too far along to reopen", () => {
    const lateBounds = getDeadlineBounds(SEASON, "2027-03-20");
    const league = cancelledLeague({ deadline: "2027-03-19" });
    const result = evaluateUpdateEligibility(
      league,
      updateOf(league, { deadline: "2027-03-25" }),
      OWNER,
      "2027-03-20",
      lateBounds,
    );
    assert.equal(!result.allowed && result.code, "season-closed");
  });

  it("locks the deadline once the league is scheduled", () => {
    const league = cancelledLeague({ status: "scheduled" });
    const result = evaluate(
      league,
      updateOf(league, { deadline: "2026-12-01" }),
    );
    assert.equal(!result.allowed && result.code, "deadline-locked");
  });

  it("only lets the owner move the deadline", () => {
    const league = cancelledLeague();
    const result = evaluateUpdateEligibility(
      league,
      updateOf(league, { deadline: "2026-12-01" }),
      "u2",
      TODAY,
      BOUNDS,
    );
    assert.equal(!result.allowed && result.code, "not-league-owner");
  });
});

describe("evaluateDeleteEligibility", () => {
  it("lets the owner delete a cancelled league", () => {
    assert.deepEqual(evaluateDeleteEligibility(cancelledLeague(), OWNER), {
      allowed: true,
    });
  });

  it("lets the owner delete a forming league", () => {
    const league = cancelledLeague({ status: "forming" });
    assert.equal(evaluateDeleteEligibility(league, OWNER).allowed, true);
  });

  it("rejects anyone but the owner", () => {
    const result = evaluateDeleteEligibility(cancelledLeague(), "u2");
    assert.equal(!result.allowed && result.code, "not-league-owner");
  });

  it("rejects a scheduled league", () => {
    const league = cancelledLeague({ status: "scheduled" });
    const result = evaluateDeleteEligibility(league, OWNER);
    assert.equal(!result.allowed && result.code, "league-started");
  });
});
