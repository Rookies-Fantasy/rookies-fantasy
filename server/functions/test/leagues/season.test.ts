import { describe, expect, it } from "vitest";
import {
  addDays,
  firstWeekStart,
  getDeadlineBounds,
  hasDeadlinePassed,
  isIsoDate,
  lastFullWeekStart,
  latestDeadline,
  minimumSeasonWeeks,
  PlayoffTeams,
  playoffTeamsFor,
  resolveDeadline,
  SeasonConfig,
  todayInPacific,
  toSeasonConfig,
} from "../../src/leagues/season";

const SEASON: SeasonConfig = {
  season: "2026-27",
  startDate: "2026-10-20",
  endDate: "2027-04-11",
};

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2027-02-28")).toBe(true);
    expect(isIsoDate("2027-02-30")).toBe(false);
    expect(isIsoDate("2027-2-28")).toBe(false);
    expect(isIsoDate(20270228)).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe("todayInPacific", () => {
  it("uses the Pacific calendar date", () => {
    expect(todayInPacific(new Date("2026-11-23T07:30:00Z"))).toBe("2026-11-22");
    expect(todayInPacific(new Date("2026-11-23T08:30:00Z"))).toBe("2026-11-23");
    expect(todayInPacific(new Date("2027-04-01T06:59:00Z"))).toBe("2027-03-31");
  });
});

describe("playoffTeamsFor", () => {
  it("uses 4 teams up to 8 and 6 teams from 10", () => {
    expect(playoffTeamsFor(4)).toBe(4);
    expect(playoffTeamsFor(8)).toBe(4);
    expect(playoffTeamsFor(10)).toBe(6);
    expect(playoffTeamsFor(20)).toBe(6);
  });
});

describe("lastFullWeekStart", () => {
  it("is the Monday of the last full Monday-Sunday week", () => {
    expect(lastFullWeekStart(SEASON)).toBe("2027-04-05");
    expect(lastFullWeekStart({ ...SEASON, endDate: "2027-04-14" })).toBe(
      "2027-04-05",
    );
    expect(lastFullWeekStart({ ...SEASON, endDate: "2027-04-10" })).toBe(
      "2027-03-29",
    );
  });
});

describe("firstWeekStart", () => {
  it("is the first Monday strictly after the deadline", () => {
    expect(firstWeekStart(SEASON, "2026-12-06")).toBe("2026-12-07");
    expect(firstWeekStart(SEASON, "2026-12-07")).toBe("2026-12-14");
  });

  it("never starts before the season", () => {
    expect(firstWeekStart(SEASON, "2026-10-01")).toBe("2026-10-26");
  });
});

describe("latestDeadline", () => {
  it("leaves one round-robin plus the playoffs for 2026-27", () => {
    expect(latestDeadline(SEASON, 4)).toBe("2027-03-07");
    expect(latestDeadline(SEASON, 6)).toBe("2027-02-28");
  });

  it("lines up with the week-one rule", () => {
    const sizes: PlayoffTeams[] = [4, 6];
    sizes.forEach((playoffTeams) => {
      const deadline = latestDeadline(SEASON, playoffTeams) ?? "";
      const lastWeek = addDays(
        firstWeekStart(SEASON, deadline),
        (minimumSeasonWeeks(playoffTeams) - 1) * 7,
      );
      expect(lastWeek).toBe(lastFullWeekStart(SEASON));
    });
  });

  it("is null when the season is too short", () => {
    expect(latestDeadline({ ...SEASON, startDate: "2027-03-20" }, 4)).toBe(
      null,
    );
  });
});

describe("getDeadlineBounds", () => {
  it("defaults to a week out once the season has started", () => {
    expect(getDeadlineBounds(SEASON, "2026-11-22")).toEqual({
      earliest: "2026-11-23",
      byPlayoffTeams: {
        4: { default: "2026-11-29", latest: "2027-03-07" },
        6: { default: "2026-11-29", latest: "2027-02-28" },
      },
    });
  });

  it("defaults to the season start before the season", () => {
    expect(getDeadlineBounds(SEASON, "2026-09-01").byPlayoffTeams[4]).toEqual({
      default: "2026-10-20",
      latest: "2027-03-07",
    });
  });

  it("caps the default and closes sizes with no window left", () => {
    expect(getDeadlineBounds(SEASON, "2027-03-01")).toEqual({
      earliest: "2027-03-02",
      byPlayoffTeams: {
        4: { default: "2027-03-07", latest: "2027-03-07" },
        6: null,
      },
    });
    expect(getDeadlineBounds(SEASON, "2027-03-06").byPlayoffTeams[4]).toEqual({
      default: "2027-03-07",
      latest: "2027-03-07",
    });
    expect(getDeadlineBounds(SEASON, "2027-03-07").byPlayoffTeams[4]).toBe(
      null,
    );
  });
});

describe("resolveDeadline", () => {
  const bounds = getDeadlineBounds(SEASON, "2026-11-22");

  it("uses the default when no deadline is sent", () => {
    expect(resolveDeadline(null, 4, bounds)).toEqual({
      ok: true,
      deadline: "2026-11-29",
    });
  });

  it("accepts the edges of the window", () => {
    expect(resolveDeadline("2026-11-23", 4, bounds)).toEqual({
      ok: true,
      deadline: "2026-11-23",
    });
    expect(resolveDeadline("2027-03-07", 8, bounds)).toEqual({
      ok: true,
      deadline: "2027-03-07",
    });
  });

  it("rejects deadlines outside the window for the league size", () => {
    expect(resolveDeadline("2026-11-22", 4, bounds)).toMatchObject({
      ok: false,
      reason: "out-of-range",
    });
    expect(resolveDeadline("2027-03-07", 10, bounds)).toEqual({
      ok: false,
      reason: "out-of-range",
      message: "Deadline must be between 2026-11-23 and 2027-02-28",
    });
  });

  it("reports a closed season", () => {
    expect(
      resolveDeadline(null, 12, getDeadlineBounds(SEASON, "2027-03-01")),
    ).toEqual({
      ok: false,
      reason: "closed",
      message: "League creation is closed for this season",
    });
  });
});

describe("hasDeadlinePassed", () => {
  it("keeps the deadline day open", () => {
    expect(hasDeadlinePassed("2026-12-01", "2026-12-01")).toBe(false);
    expect(hasDeadlinePassed("2026-12-01", "2026-12-02")).toBe(true);
  });
});

describe("toSeasonConfig", () => {
  it("parses a valid config", () => {
    expect(toSeasonConfig({ ...SEASON })).toEqual(SEASON);
  });

  it("rejects malformed configs", () => {
    expect(toSeasonConfig({ ...SEASON, endDate: "2027-02-30" })).toBe(null);
    expect(toSeasonConfig({ ...SEASON, endDate: "2026-10-20" })).toBe(null);
    expect(toSeasonConfig({ startDate: "2026-10-20" })).toBe(null);
  });
});
