import { Augment } from "./augment";
import { SlotPosition, TeamRecord } from "./team";

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

export type PlayerSnapshot = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: SlotPosition[];
  salary: number;
  id: string;
  gameStats: GameStats;
  gameInfo: GameInfo;
};

export type TeamSnapshot = {
  name: string;
  logoUrl: string;
  record: TeamRecord;
  augmentSnapshot?: Augment;
};

export type LineupSnapshotItem = {
  position: SlotPosition;
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
  status: "active" | "completed";
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  awayScore?: number;
  homeScore?: number;
  winnerId?: string;
};
