export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type RawPayload = { [key: string]: JsonValue };

export const EMPTY_PAYLOAD: RawPayload = {};

export const LEAGUE_STATUSES = [
  "forming",
  "scheduled",
  "unscheduled",
  "active",
  "playoffs",
  "complete",
] as const;

export type LeagueStatus = (typeof LEAGUE_STATUSES)[number];

// A league document reduced to the fields the server actually reasons about.
export type LeagueDocument = {
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
};

export type CreateLeagueInput = {
  name: string;
  numberOfTeams: number;
  budget: number;
  initialTeamId: string;
  deadline: string | null;
};

export type JoinLeagueInput = {
  leagueId: string;
  teamId: string;
};

export type UpdateLeagueInput = {
  leagueId: string;
  name: string;
  numberOfTeams: number;
  budget: number;
};

// The league rules. These mirror the form constants and yup schema in
// `client/utils/leagueUtils.ts` so a hand-rolled request can't create or edit
// a league into a state the UI would never allow.
export const MIN_TEAMS = 4;
export const MAX_TEAMS = 20;
export const TEAMS_STEP = 2;
export const MIN_BUDGET = 150_000_000;
export const MAX_BUDGET = 250_000_000;
export const BUDGET_STEP = 25_000_000;
export const MAX_LEAGUE_NAME_LENGTH = 50;

export type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type LeagueStandingTeam = {
  id: string;
  name: string;
  logoUrl: string;
  record: TeamRecord;
};
