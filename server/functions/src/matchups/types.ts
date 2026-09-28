import type { LineupSnapshotItem, TeamSnapshot } from "../shared/types";

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
