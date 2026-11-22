import { JsonValue, MIN_TEAMS, RawPayload } from "./types";

export type SeasonConfig = {
  season: string;
  startDate: string;
  endDate: string;
};

export type PlayoffTeams = 4 | 6;

export type DeadlineWindow = {
  default: string;
  latest: string;
};

export type LeagueDeadlineBounds = {
  earliest: string;
  byPlayoffTeams: Record<PlayoffTeams, DeadlineWindow | null>;
};

export type DeadlineResolution =
  | { ok: true; deadline: string }
  | { ok: false; reason: "closed" | "out-of-range"; message: string };

const PACIFIC_TIME_ZONE = "America/Los_Angeles";
const DAYS_PER_WEEK = 7;
const MONDAY = 1;
const DEFAULT_DEADLINE_LEAD_DAYS = 7;
const LARGE_LEAGUE_MIN_TEAMS = 10;
const PLAYOFF_WEEKS: Record<PlayoffTeams, number> = { 4: 2, 6: 3 };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toUtcDate = (date: string): Date => new Date(`${date}T00:00:00Z`);

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const isIsoDate = (value: JsonValue): value is string =>
  typeof value === "string" &&
  ISO_DATE_PATTERN.test(value) &&
  !isNaN(toUtcDate(value).getTime()) &&
  toIsoDate(toUtcDate(value)) === value;

export const addDays = (date: string, days: number): string => {
  const next = toUtcDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return toIsoDate(next);
};

const dayOfWeek = (date: string): number => toUtcDate(date).getUTCDay();

const laterDate = (a: string, b: string): string => (a > b ? a : b);

const earlierDate = (a: string, b: string): string => (a < b ? a : b);

export const todayInPacific = (now: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

const firstMondayOnOrAfter = (date: string): string =>
  addDays(date, (MONDAY - dayOfWeek(date) + DAYS_PER_WEEK) % DAYS_PER_WEEK);

export const firstWeekStart = (
  season: SeasonConfig,
  deadline: string,
): string =>
  firstMondayOnOrAfter(laterDate(season.startDate, addDays(deadline, 1)));

export const lastFullWeekStart = (season: SeasonConfig): string =>
  addDays(season.endDate, -dayOfWeek(season.endDate) - (DAYS_PER_WEEK - 1));

export const playoffTeamsFor = (numberOfTeams: number): PlayoffTeams =>
  numberOfTeams >= LARGE_LEAGUE_MIN_TEAMS ? 6 : 4;

export const playoffWeeksFor = (playoffTeams: PlayoffTeams): number =>
  PLAYOFF_WEEKS[playoffTeams];

export const minimumSeasonWeeks = (playoffTeams: PlayoffTeams): number =>
  MIN_TEAMS - 1 + playoffWeeksFor(playoffTeams);

export const latestDeadline = (
  season: SeasonConfig,
  playoffTeams: PlayoffTeams,
): string | null => {
  const latestWeekOne = addDays(
    lastFullWeekStart(season),
    -(minimumSeasonWeeks(playoffTeams) - 1) * DAYS_PER_WEEK,
  );

  if (latestWeekOne < firstMondayOnOrAfter(season.startDate)) {
    return null;
  }

  return addDays(latestWeekOne, -1);
};

const deadlineWindow = (
  season: SeasonConfig,
  playoffTeams: PlayoffTeams,
  today: string,
): DeadlineWindow | null => {
  const latest = latestDeadline(season, playoffTeams);

  if (latest === null || latest < addDays(today, 1)) {
    return null;
  }

  const preferred = laterDate(
    season.startDate,
    addDays(today, DEFAULT_DEADLINE_LEAD_DAYS),
  );

  return { default: earlierDate(preferred, latest), latest };
};

export const getDeadlineBounds = (
  season: SeasonConfig,
  today: string,
): LeagueDeadlineBounds => ({
  earliest: addDays(today, 1),
  byPlayoffTeams: {
    4: deadlineWindow(season, 4, today),
    6: deadlineWindow(season, 6, today),
  },
});

export const resolveDeadline = (
  requested: string | null,
  numberOfTeams: number,
  bounds: LeagueDeadlineBounds,
): DeadlineResolution => {
  const range = bounds.byPlayoffTeams[playoffTeamsFor(numberOfTeams)];

  if (range === null) {
    return {
      ok: false,
      reason: "closed",
      message: "League creation is closed for this season",
    };
  }

  const deadline = requested ?? range.default;

  if (deadline < bounds.earliest || deadline > range.latest) {
    return {
      ok: false,
      reason: "out-of-range",
      message: `Deadline must be between ${bounds.earliest} and ${range.latest}`,
    };
  }

  return { ok: true, deadline };
};

export const hasDeadlinePassed = (deadline: string, today: string): boolean =>
  today > deadline;

export const toSeasonConfig = (data: RawPayload): SeasonConfig | null => {
  const { season, startDate, endDate } = data;

  if (
    typeof season !== "string" ||
    !isIsoDate(startDate) ||
    !isIsoDate(endDate) ||
    startDate >= endDate
  ) {
    return null;
  }

  return { season, startDate, endDate };
};
