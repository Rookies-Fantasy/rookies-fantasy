export type GameInfo = {
  gameStatus: boolean;
  opponent: string;
  gameDate: string;
  isHome: boolean;
};

export type GameStats = {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fantasyPoints: number;
  minutes: number;
};

// The `record` field on a team document. Written by matchups, read by
// leagues. Mirrors `TeamRecord` in client/types/team.ts.
export type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
export type TeamPosition = Position | FlexPosition;

export type PlayerTeamDisplay = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: TeamPosition[];
  salary: number;
  id: string;
  teamAbbreviation: string;
};

export type TeamLineupSlot = {
  position: TeamPosition;
  player: PlayerTeamDisplay | null;
};

export type PlayerSnapshot = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: TeamPosition[];
  salary: number;
  id: string;
  gameStats: GameStats;
  gameInfo: GameInfo;
};

export type TeamSnapshot = {
  name: string;
  logoUrl: string;
  record: TeamRecord;
  lineup: TeamLineupSlot[];
  augmentSnapshot?: any;
  score?: number;
};

export type LineupSnapshotItem = {
  position: TeamPosition;
  playerSnapshot: PlayerSnapshot;
};
