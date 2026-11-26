export const LEAGUE_STATUSES = [
  "forming",
  "scheduled",
  "unscheduled",
  "active",
  "playoffs",
  "complete",
  "deleted",
] as const;

export type LeagueStatus = (typeof LEAGUE_STATUSES)[number];

export type League = {
  id: string;
  name: string;
  creatorUserId: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  teamIds: string[];
  userIds: string[];
  deadline: string;
  status: LeagueStatus;
  playoffTeams: number | null;
  regularSeasonWeeks: number | null;
  playoffStartWeek: number | null;
  createdAt?: string;
  updatedAt?: string;
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
