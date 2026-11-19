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

const showSupportEmailAlert = () =>
  Alert.alert(
    "Couldn't open Mail",
    `Please email ${SUPPORT_EMAIL} with the team name you'd like to report.`,
  );

// Opens the user's mail app with the report prefilled, falling back to an
// alert with the support address when no mail app can handle the link (e.g.
// Mail isn't set up, or on the iOS Simulator).
export const openTeamReportEmail = async (report: TeamNameReport) => {
  try {
    await Linking.openURL(buildTeamReportEmailUrl(report));
  } catch {
    showSupportEmailAlert();
  }
};

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
