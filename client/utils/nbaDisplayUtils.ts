// Helpers for the original placeholder visuals that stand in for NBA-owned
// imagery (player headshots and team logos), which the app must not display.

const PLACEHOLDER_LABEL = "-";
const TEAM_LABEL_LENGTH = 3;

const firstLetter = (value: string) => value.trim().charAt(0).toUpperCase();

export const getPlayerInitials = (firstName: string, lastName: string) => {
  const initials = `${firstLetter(firstName)}${firstLetter(lastName)}`;

  return initials.length > 0 ? initials : PLACEHOLDER_LABEL;
};

export const getTeamBadgeLabel = (abbreviation: string, teamName: string) => {
  const trimmedAbbreviation = abbreviation.trim().toUpperCase();

  if (trimmedAbbreviation.length > 0) return trimmedAbbreviation;

  const nameLabel = teamName
    .replace(/\s+/g, "")
    .slice(0, TEAM_LABEL_LENGTH)
    .toUpperCase();

  return nameLabel.length > 0 ? nameLabel : PLACEHOLDER_LABEL;
};
