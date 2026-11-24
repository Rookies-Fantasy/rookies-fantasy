import { describe, expect, it } from "@jest/globals";
import {
  buildSupportEmailUrl,
  buildTeamReportEmailUrl,
  SUPPORT_EMAIL,
} from "@/utils/reportUtils";

describe("buildTeamReportEmailUrl", () => {
  const report = {
    teamName: "Splash & Dash",
    teamId: "team-123",
    matchupId: "matchup-456",
    reporterUserId: "user-789",
  };

  it("addresses the support inbox", () => {
    expect(
      buildTeamReportEmailUrl(report).startsWith(`mailto:${SUPPORT_EMAIL}?`),
    ).toBe(true);
  });

  it("includes the team, matchup and reporter ids", () => {
    const url = buildTeamReportEmailUrl(report);
    const params = url.slice(url.indexOf("?") + 1).split("&");
    const subject = decodeURIComponent(params[0].replace("subject=", ""));
    const body = decodeURIComponent(params[1].replace("body=", ""));

    expect(params).toHaveLength(2);
    expect(subject).toContain("Splash & Dash");
    expect(body).toContain("Team name: Splash & Dash");
    expect(body).toContain("Team ID: team-123");
    expect(body).toContain("Matchup ID: matchup-456");
    expect(body).toContain("Reported by user ID: user-789");
  });
});

describe("buildSupportEmailUrl", () => {
  it("addresses the support inbox with an encoded subject and body", () => {
    const url = buildSupportEmailUrl();
    const params = url.slice(url.indexOf("?") + 1).split("&");
    const subject = decodeURIComponent(params[0].replace("subject=", ""));

    expect(url.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
    expect(params).toHaveLength(2);
    expect(params[0]).not.toContain(" ");
    expect(subject).toBe("Rookies Fantasy support");
  });
});
