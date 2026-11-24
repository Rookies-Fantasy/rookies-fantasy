import { Alert, Linking } from "react-native";
import { TeamNameReport } from "@/types/moderation";

export const SUPPORT_EMAIL = "admin@rookiesfantasy.com";

// Builds a prefilled `mailto:` link so support receives everything needed to
// find the reported team without a back-and-forth.
export const buildTeamReportEmailUrl = (report: TeamNameReport): string => {
  const subject = `Report: team name "${report.teamName}"`;
  const body = [
    "I'd like to report this team name as offensive or inappropriate.",
    "",
    `Team name: ${report.teamName}`,
    `Team ID: ${report.teamId}`,
    `Matchup ID: ${report.matchupId}`,
    `Reported by user ID: ${report.reporterUserId}`,
    "",
    "Additional details (optional):",
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

// Builds a `mailto:` link for general support requests and problem reports.
export const buildSupportEmailUrl = (): string => {
  const subject = "Rookies Fantasy support";
  const body = "Describe your question or the problem you ran into:\n\n";

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

// Opens the user's mail app with `url`, falling back to an alert that shows
// `fallbackMessage` (which includes the support address) when no mail app can
// handle the link (e.g. Mail isn't set up, or on the iOS Simulator).
const openSupportMailUrl = async (url: string, fallbackMessage: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn't open Mail", fallbackMessage);
  }
};

export const openTeamReportEmail = (report: TeamNameReport) =>
  openSupportMailUrl(
    buildTeamReportEmailUrl(report),
    `Please email ${SUPPORT_EMAIL} with the team name you'd like to report.`,
  );

// Used by the Settings "Contact support" row.
export const openSupportEmail = () =>
  openSupportMailUrl(
    buildSupportEmailUrl(),
    `Please email us at ${SUPPORT_EMAIL}.`,
  );

// Asks the user to confirm before handing off to the mail app.
export const confirmTeamReport = (report: TeamNameReport) =>
  Alert.alert(
    "Report Team",
    `Report "${report.teamName}" for an offensive or inappropriate name? We'll open an email to our support team.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: () => {
          openTeamReportEmail(report);
        },
      },
    ],
  );
