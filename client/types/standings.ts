import { Team, TeamRecord } from "./team";

// Standings-relevant fields returned by the getLeagueStandings cloud function.
export type LeagueStandingTeam = {
  id: string;
  name: string;
  logoUrl: string;
  record: TeamRecord;
};

// A single row in a league standings table. Derived from a team's record via
// utils/standingsUtils.ts — the leaderboard never persists this shape.
export type StandingsRow = {
  rank: number;
  team: Team;
  // The team's record, flattened so the table can render it without re-deriving
  // it (and without re-applying the empty-record fallback) in the view.
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winPct: number; // 0..1
  winPctLabel: string; // winPct as a display string, e.g. "75%"
  points: number; // standings points: wins * 3 + draws * 1
};

// One tile of the standings podium, in the left-to-right order it is rendered.
// `highlighted` marks the outright leader — it is false for every tile when the
// top rank is shared, so a tie is never presented as a win.
export type PodiumTile = {
  row: StandingsRow;
  highlighted: boolean;
};

// The headline numbers shown above the standings table. Everything here is
// derived from the standings rows on screen, so the tiles can never disagree
// with the table below them.
export type LeagueSummaryStats = {
  teamCount: number;
  mostGamesPlayed: number;
  leaderLabel: string;
};
