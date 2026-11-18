import { formatLocalDate } from "../../../client/utils/dateUtils.js";

export { formatLocalDate };

export const parseDate = (value: string, label = "Date"): string => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    formatLocalDate(new Date(`${value}T12:00:00`)) !== value
  ) {
    throw new Error(
      `${label} must be a valid calendar date in YYYY-MM-DD format. Received "${value}".`,
    );
  }

  return value;
};

const addDays = (dateString: string, days: number): string => {
  // Use local calendar days, including when a week crosses a DST change.
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export const getSimulationDates = (
  matchupId: string,
  weekStart: string,
  requestedDate?: string,
): string[] => {
  parseDate(weekStart, `Matchup "${matchupId}" weekStart`);
  const startDate = parseDate(requestedDate ?? weekStart, "SIM_DATE");
  const dates = Array.from({ length: 7 }, (_, day) => addDays(weekStart, day));
  const weekEnd = dates[6];

  if (startDate < weekStart || startDate > weekEnd) {
    throw new Error(
      `SIM_DATE "${startDate}" is outside matchup "${matchupId}" week (${weekStart} to ${weekEnd}).`,
    );
  }

  return dates.filter((date) => date >= startDate);
};
