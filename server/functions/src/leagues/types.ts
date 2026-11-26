import type { TeamRecord } from "../shared/types";

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
  // Team id -> uid of the member who registered it. Team docs live under
  // users/{uid}/teams, so this is how the server finds a league team without
  // trusting whichever user happens to hold a doc with that id.
  teamOwners: Record<string, string>;
};

// The league fields returned to the client. Mirrors `League` in
// client/types/league.ts.
export type LeagueResponse = {
  id: string;
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

// The team the caller is joining with. It does not exist yet: joinLeague
// creates it in the same transaction that adds it to the league, so a rejected
// join never leaves a team document behind.
export type NewLeagueTeam = {
  name: string;
  abbreviation: string;
  logoUrl: string;
};

export type JoinLeagueInput = {
  leagueId: string;
  team: NewLeagueTeam;
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

export type LeagueStandingTeam = {
  id: string;
  name: string;
  logoUrl: string;
  record: TeamRecord;
};

// The team rules, mirroring the yup schema in
// `client/app/(protected)/joinLeague.tsx`.
export const TEAM_ABBREVIATION_LENGTH = 3;
export const MAX_TEAM_NAME_LENGTH = 50;
export const MAX_LOGO_URL_LENGTH = 2048;
