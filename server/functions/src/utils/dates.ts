// Date helpers for the matchup week lifecycle. Matchup weeks run Monday–Sunday
// in Pacific Time, and dates are stored as "YYYY-MM-DD" strings.

export const MATCHUP_TIME_ZONE = "America/Los_Angeles";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pacificDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MATCHUP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const parseDateString = (date: string): Date => {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${date}".`);
  }
  // Calendar arithmetic in UTC avoids DST shifts on date-only values.
  return new Date(`${date}T00:00:00Z`);
};

const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

// The calendar date in Pacific Time at the given instant.
export const getPacificDateString = (now: Date): string => {
  const parts = pacificDateFormatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

export const addDays = (date: string, days: number): string => {
  const result = parseDateString(date);
  result.setUTCDate(result.getUTCDate() + days);
  return toDateString(result);
};

// The Monday that starts the matchup week containing `date`.
export const getWeekStartForDate = (date: string): string => {
  const day = parseDateString(date).getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
};

// The Monday (Pacific Time) of the week that is in progress at `now`.
export const getCurrentWeekStart = (now: Date): string =>
  getWeekStartForDate(getPacificDateString(now));

// A matchup's week is over once the current Pacific week starts after it.
// Matchups for the current or an upcoming week are not over.
export const isMatchupWeekOver = (weekStart: string, now: Date): boolean =>
  DATE_PATTERN.test(weekStart) && weekStart < getCurrentWeekStart(now);

// The daily stats job runs after midnight Pacific Time and scores the
// previous day's games. Returns the game date being scored and the week it
// belongs to.
export const getDailyScoringTarget = (
  now: Date,
): { gameDate: string; weekStart: string } => {
  const gameDate = addDays(getPacificDateString(now), -1);
  return { gameDate, weekStart: getWeekStartForDate(gameDate) };
};
