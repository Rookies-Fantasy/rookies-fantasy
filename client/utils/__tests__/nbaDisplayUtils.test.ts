import { describe, expect, it } from "@jest/globals";
import { getPlayerInitials, getTeamBadgeLabel } from "@/utils/nbaDisplayUtils";

describe("getPlayerInitials", () => {
  it("returns uppercase first and last initials", () => {
    expect(getPlayerInitials("nikola", "jokic")).toBe("NJ");
  });

  it("handles a missing last name", () => {
    expect(getPlayerInitials("Nene", "")).toBe("N");
  });

  it("falls back to a placeholder when both names are empty", () => {
    expect(getPlayerInitials(" ", "")).toBe("-");
  });
});

describe("getTeamBadgeLabel", () => {
  it("uses the team abbreviation when present", () => {
    expect(getTeamBadgeLabel("den", "Nuggets")).toBe("DEN");
  });

  it("falls back to the first three letters of the team name", () => {
    expect(getTeamBadgeLabel("", "Trail Blazers")).toBe("TRA");
  });

  it("falls back to a placeholder when no data is available", () => {
    expect(getTeamBadgeLabel("", "")).toBe("-");
  });
});
