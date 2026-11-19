import { MatchupWeekPhase } from "@/types/matchup";

// Compares a matchup's week (its Monday, YYYY-MM-DD) with the current week.
export const getMatchupWeekPhase = (
  weekStart: string,
  currentWeekStart: string,
): MatchupWeekPhase => {
  if (weekStart > currentWeekStart) return "upcoming";
  if (weekStart < currentWeekStart) return "ended";
  return "current";
};

// "Monday, Nov 23" for a YYYY-MM-DD date.
export const formatMatchupStartLabel = (weekStart: string): string => {
  const [year, month, day] = weekStart.split("-").map(Number);
  // Noon avoids the label shifting a day in any time zone.
  const date = new Date(year, month - 1, day, 12);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${weekday}, ${monthDay}`;
};
