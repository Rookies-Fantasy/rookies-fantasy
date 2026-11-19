import { describe, expect, it } from "@jest/globals";
import {
  formatMatchupStartLabel,
  getMatchupWeekPhase,
} from "@/utils/matchupUtils";

describe("getMatchupWeekPhase", () => {
  it("is upcoming when the matchup starts after the current week", () => {
    expect(getMatchupWeekPhase("2026-11-23", "2026-11-16")).toBe("upcoming");
  });

  it("is current when the matchup week is the current week", () => {
    expect(getMatchupWeekPhase("2026-11-16", "2026-11-16")).toBe("current");
  });

  it("is ended when the matchup week is before the current week", () => {
    expect(getMatchupWeekPhase("2026-11-09", "2026-11-16")).toBe("ended");
  });

  it("compares across month and year boundaries", () => {
    expect(getMatchupWeekPhase("2027-01-04", "2026-12-28")).toBe("upcoming");
    expect(getMatchupWeekPhase("2026-11-30", "2026-12-07")).toBe("ended");
  });
});

describe("formatMatchupStartLabel", () => {
  it("formats the weekday and date", () => {
    expect(formatMatchupStartLabel("2026-11-23")).toBe("Monday, Nov 23");
    expect(formatMatchupStartLabel("2027-01-04")).toBe("Monday, Jan 4");
  });
});
