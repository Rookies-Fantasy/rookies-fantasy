import { describe, expect, it } from "vitest";
import { LeagueDocument, RawPayload } from "../../src/leagues/types";
import {
  evaluateJoinEligibility,
  toLeagueDocument,
  validateCreateLeagueInput,
} from "../../src/leagues/validation";

const LEAGUE: LeagueDocument = {
  name: "Test League",
  creatorUserId: "creator",
  numberOfTeams: 4,
  budget: 150_000_000,
  memberCount: 1,
  teamIds: ["creator-team"],
  userIds: ["creator"],
  deadline: "2026-12-01",
  status: "forming",
  playoffTeams: null,
  regularSeasonWeeks: null,
  playoffStartWeek: null,
};

const CREATE_PAYLOAD: RawPayload = {
  name: "Test League",
  numberOfTeams: 4,
  budget: 150_000_000,
  initialTeamId: "team-1",
};

describe("toLeagueDocument", () => {
  it("parses a league with lifecycle fields", () => {
    expect(toLeagueDocument({ ...LEAGUE })).toEqual(LEAGUE);
  });

  it("rejects leagues missing or corrupting lifecycle fields", () => {
    const withoutDeadline: RawPayload = { ...LEAGUE };
    delete withoutDeadline.deadline;

    expect(toLeagueDocument(withoutDeadline)).toBe(null);
    expect(toLeagueDocument({ ...LEAGUE, status: "open" })).toBe(null);
    expect(toLeagueDocument({ ...LEAGUE, playoffTeams: "4" })).toBe(null);
  });
});

describe("validateCreateLeagueInput deadline", () => {
  it("treats a missing or null deadline as the default", () => {
    expect(validateCreateLeagueInput(CREATE_PAYLOAD)).toMatchObject({
      valid: true,
      input: { deadline: null },
    });
    expect(
      validateCreateLeagueInput({ ...CREATE_PAYLOAD, deadline: null }),
    ).toMatchObject({ valid: true, input: { deadline: null } });
  });

  it("keeps a YYYY-MM-DD deadline", () => {
    expect(
      validateCreateLeagueInput({ ...CREATE_PAYLOAD, deadline: "2026-12-01" }),
    ).toMatchObject({ valid: true, input: { deadline: "2026-12-01" } });
  });

  it("rejects malformed deadlines", () => {
    const rejected = {
      valid: false,
      message: "Deadline must be a YYYY-MM-DD date",
    };

    expect(
      validateCreateLeagueInput({ ...CREATE_PAYLOAD, deadline: "12/01/2026" }),
    ).toEqual(rejected);
    expect(
      validateCreateLeagueInput({ ...CREATE_PAYLOAD, deadline: 1764547200 }),
    ).toEqual(rejected);
  });
});

describe("evaluateJoinEligibility", () => {
  it("allows joins through the deadline day", () => {
    expect(
      evaluateJoinEligibility(LEAGUE, "team-2", "user-2", "2026-12-01"),
    ).toEqual({ allowed: true });
  });

  it("rejects joins after the deadline", () => {
    expect(
      evaluateJoinEligibility(LEAGUE, "team-2", "user-2", "2026-12-02"),
    ).toEqual({
      allowed: false,
      code: "league-closed",
      message: "This league is no longer accepting members",
    });
  });

  it("rejects joins once the league is no longer forming", () => {
    expect(
      evaluateJoinEligibility(
        { ...LEAGUE, status: "scheduled" },
        "team-2",
        "user-2",
        "2026-11-22",
      ),
    ).toMatchObject({ allowed: false, code: "league-closed" });
  });

  it("still reports an existing member before a closed league", () => {
    expect(
      evaluateJoinEligibility(LEAGUE, "team-2", "creator", "2026-12-02"),
    ).toMatchObject({ allowed: false, code: "user-already-joined" });
  });
});
