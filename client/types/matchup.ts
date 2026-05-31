import { Player } from "./player";
import { FlexPosition, Position, TeamRecord } from "./team";

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

// export type MatchupTeam = {
//   lineup: LineupSlot[];
//   qualifyingPlayers?: Player[];
//   score?: number;
// };

// export type DailyMatchup = {
//   awayTeam: MatchupTeam;
//   homeTeam: MatchupTeam;
// };

type PlayerSnapshot = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: Position[];
  salary: number;
  id: string;
  gameStats: GameStats;
  gameInfo: GameInfo;
};

type TeamSnapshot = {
  name: string;
  logoUrl: string;
  record: TeamRecord;
  augment: any;
  score?: number;
};

type TeamPosition = Position | FlexPosition;

type LineupSnapshotItem = {
  position: TeamPosition;
  playerSnapshot: PlayerSnapshot;
};

export type Matchup = {
  createdAt: Date;
  id: string;
  weekStart: string;
  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  status: "active" | "complete";
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  winnerId?: string;
};
