import { Team, TeamRecord } from "./team";

export type LeagueStandingTeam = {
  id: string;
  name: string;
  logoUrl: string;
  record: TeamRecord;
};

export type StandingsRow = {
  rank: number;
  team: Team;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winPct: number; // 0..1
  winPctLabel: string; // winPct as a display string, e.g. "75%"
  points: number; // standings points: wins * 3 + draws * 1
};

export type PodiumTile = {
  row: StandingsRow;
  highlighted: boolean;
};

export type LeagueSummaryStats = {
  teamCount: number;
  mostGamesPlayed: number;
  leaderLabel: string;
};

// Points awarded per result when ranking teams. Wins are worth 3, draws 1.
export const WIN_POINTS = 3;
export const DRAW_POINTS = 1;

// Typed fallback for a team that hasn't played (or persisted) a record yet.
export const EMPTY_RECORD: TeamRecord = { wins: 0, losses: 0, draws: 0 };
