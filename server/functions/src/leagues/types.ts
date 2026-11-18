export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type RawPayload = { [key: string]: JsonValue };

export const EMPTY_PAYLOAD: RawPayload = {};

// A league document reduced to the fields the server actually reasons about.
export type LeagueDocument = {
  name: string;
  creatorUserId: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  teamIds: string[];
  userIds: string[];
};

export type CreateLeagueInput = {
  name: string;
  numberOfTeams: number;
  budget: number;
  initialTeamId: string;
};

export type JoinLeagueInput = {
  leagueId: string;
  teamId: string;
};

// The league rules. These mirror the form constants and yup schema in
// `client/app/(protected)/createLeague.tsx` so a hand-rolled request can't create
// a league the UI would never allow.
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
