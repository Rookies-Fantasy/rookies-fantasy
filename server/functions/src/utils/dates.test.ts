import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  addDays,
  getCurrentWeekStart,
  getDailyScoringTarget,
  getPacificDateString,
  getWeekStartForDate,
  isMatchupWeekOver,
} from "./dates";

// Instants are given in UTC. November 2026 is PST (UTC-8); March 2027 crosses
// the DST change on Sunday 2027-03-14.
describe("getPacificDateString", () => {
  it("uses the Pacific calendar day, not UTC", () => {
    // Sunday 2026-11-22 20:00 PT is already Monday in UTC.
    assert.equal(
      getPacificDateString(new Date("2026-11-23T04:00:00Z")),
      "2026-11-22",
    );
    assert.equal(
      getPacificDateString(new Date("2026-11-23T08:00:00Z")),
      "2026-11-23",
    );
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    assert.equal(addDays("2026-11-30", 1), "2026-12-01");
    assert.equal(addDays("2027-01-01", -1), "2026-12-31");
  });

  it("is unaffected by DST changes", () => {
    assert.equal(addDays("2027-03-13", 1), "2027-03-14");
    assert.equal(addDays("2027-03-14", 1), "2027-03-15");
  });
});

describe("getWeekStartForDate", () => {
  it("returns the Monday of a Monday–Sunday week", () => {
    assert.equal(getWeekStartForDate("2026-11-16"), "2026-11-16"); // Mon
    assert.equal(getWeekStartForDate("2026-11-18"), "2026-11-16"); // Wed
    assert.equal(getWeekStartForDate("2026-11-22"), "2026-11-16"); // Sun
    assert.equal(getWeekStartForDate("2026-11-23"), "2026-11-23"); // Mon
    assert.equal(getWeekStartForDate("2026-12-01"), "2026-11-30"); // Tue
  });

  it("rejects malformed dates", () => {
    assert.throws(() => getWeekStartForDate("11/16/2026"));
  });
});

describe("getCurrentWeekStart", () => {
  it("uses the Pacific week at the Monday reset (02:00 PT)", () => {
    // Monday 2026-11-23 02:00 PST = 10:00 UTC.
    assert.equal(
      getCurrentWeekStart(new Date("2026-11-23T10:00:00Z")),
      "2026-11-23",
    );
  });

  it("is still the previous week on Sunday evening PT", () => {
    assert.equal(
      getCurrentWeekStart(new Date("2026-11-23T04:00:00Z")),
      "2026-11-16",
    );
  });
});

describe("isMatchupWeekOver (weekly reset filter)", () => {
  // The reset runs Monday 2026-11-23 at 02:00 PT.
  const resetRun = new Date("2026-11-23T10:00:00Z");

  it("completes matchups from the previous week", () => {
    assert.equal(isMatchupWeekOver("2026-11-16", resetRun), true);
    assert.equal(isMatchupWeekOver("2026-11-09", resetRun), true);
  });

  it("keeps matchups for the week that starts today", () => {
    assert.equal(isMatchupWeekOver("2026-11-23", resetRun), false);
  });

  it("keeps matchups for a later week", () => {
    assert.equal(isMatchupWeekOver("2026-11-30", resetRun), false);
  });

  it("keeps the current week when it runs late on Sunday PT", () => {
    // Sunday 2026-11-22 23:30 PT: the week of 2026-11-16 is still in progress.
    assert.equal(
      isMatchupWeekOver("2026-11-16", new Date("2026-11-23T07:30:00Z")),
      false,
    );
  });

  it("ignores matchups without a valid weekStart", () => {
    assert.equal(isMatchupWeekOver("", resetRun), false);
  });
});

describe("getDailyScoringTarget (daily stats job)", () => {
  it("scores Saturday's games into that week on Sunday 01:00 PT", () => {
    // Sunday 2026-11-22 01:00 PST = 09:00 UTC.
    assert.deepEqual(getDailyScoringTarget(new Date("2026-11-22T09:00:00Z")), {
      gameDate: "2026-11-21",
      weekStart: "2026-11-16",
    });
  });

  it("scores Sunday's games into the ending week on Monday 01:00 PT", () => {
    // Monday 2026-11-23 01:00 PST = 09:00 UTC.
    assert.deepEqual(getDailyScoringTarget(new Date("2026-11-23T09:00:00Z")), {
      gameDate: "2026-11-22",
      weekStart: "2026-11-16",
    });
  });

  it("scores Monday's games into the new week on Tuesday 01:00 PT", () => {
    assert.deepEqual(getDailyScoringTarget(new Date("2026-11-24T09:00:00Z")), {
      gameDate: "2026-11-23",
      weekStart: "2026-11-23",
    });
  });

  it("handles the DST change (Monday 2027-03-15 01:00 PDT)", () => {
    // 01:00 PDT = 08:00 UTC.
    assert.deepEqual(getDailyScoringTarget(new Date("2027-03-15T08:00:00Z")), {
      gameDate: "2027-03-14",
      weekStart: "2027-03-08",
    });
  });
});
