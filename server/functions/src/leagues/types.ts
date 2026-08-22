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

export const EMPTY_RECORD: TeamRecord = { wins: 0, losses: 0, draws: 0 };
