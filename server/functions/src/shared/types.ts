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

// Store the augment id for now, maybe reconsider this later. Some things to consider are what we actually need to display the team (probably just name and icon)
// as well as augment versioning for future patches
export type Team = {
  abbreviation?: string;
  augmentId?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
  lineup: TeamLineupSlot[];
  record?: TeamRecord;
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
  augmentSnapshot?: any;
  score?: number;
};

export type LineupSnapshotItem = {
  position: TeamPosition;
  playerSnapshot: PlayerSnapshot;
};
