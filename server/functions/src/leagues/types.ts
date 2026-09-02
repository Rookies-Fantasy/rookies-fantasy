// JSON-shaped boundary types. Callable payloads and Firestore documents arrive
// untyped, and the project standard forbids `any`/`unknown` — these give the raw
// data an explicit, narrowable shape so every field is proven before use.
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
//
// The steps matter as much as the bounds: the UI only ever offers 4/6/…/20 teams
// and $150M/$175M/…/$250M budgets, so a league of 5 teams or $160M is not a
// league this app knows how to run, however well-formed the request looks.
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

// The per-team fields getLeagueStandings returns. Mirrors `LeagueStandingTeam`
// in client/types/standings.ts.
export type LeagueStandingTeam = {
  id: string;
  name: string;
  logoUrl: string;
  record: TeamRecord;
};
