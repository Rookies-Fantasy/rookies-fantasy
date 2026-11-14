import type { LineupSnapshotItem, TeamSnapshot } from "../shared/types";

type MatchupBase = {
  createdAt: Date;
  id: string;
  weekStart: string;
  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  awayScore?: number;
  homeScore?: number;
  winnerId?: string;
};

type RankedMatchup = MatchupBase & {
  leagueId: null;
  status: "active" | "completed";
};

type LeagueMatchup = MatchupBase & {
  leagueId: string;
  week: number;
  phase: "regular" | "playoff";
  status: "scheduled" | "active" | "completed";
};

export type Matchup = RankedMatchup | LeagueMatchup;
