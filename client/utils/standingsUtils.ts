import {
  LeagueSummaryStats,
  PodiumTile,
  StandingsRow,
} from "@/types/standings";
import { Team, TeamRecord } from "@/types/team";

// Typed fallback for a team that hasn't played (or persisted) a record yet.
export const EMPTY_RECORD: TeamRecord = { wins: 0, losses: 0, draws: 0 };

// Renders a team's record as a "W-L-D" label, falling back to zeros when a team
// has no record yet.
export const formatRecord = (team: Team): string => {
  const record = team.record ?? EMPTY_RECORD;
  return `${record.wins}-${record.losses}-${record.draws}`;
};

// Points awarded per result when ranking teams. Wins are worth 3, draws 1.
const WIN_POINTS = 3;
const DRAW_POINTS = 1;

export const getStandingsPoints = (record: TeamRecord): number =>
  record.wins * WIN_POINTS + record.draws * DRAW_POINTS;

export const getGamesPlayed = (record: TeamRecord): number =>
  record.wins + record.losses + record.draws;

export const getWinPct = (record: TeamRecord): number => {
  const gamesPlayed = getGamesPlayed(record);
  return gamesPlayed === 0 ? 0 : record.wins / gamesPlayed;
};

// Renders a 0..1 win percentage as a whole-number display string.
export const formatWinPct = (winPct: number): string =>
  `${Math.round(winPct * 100)}%`;

type UnrankedRow = Omit<StandingsRow, "rank">;

// Orders two teams on merit alone: standings points, then win percentage, then
// raw wins. Returns 0 when nothing separates them — that is a genuine tie, and
// the two teams share a rank.
const compareOnMerit = (a: UnrankedRow, b: UnrankedRow): number => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.winPct !== a.winPct) return b.winPct - a.winPct;
  const aWins = a.team.record?.wins ?? 0;
  const bWins = b.team.record?.wins ?? 0;
  return bWins - aWins;
};

// Sorts teams into ranked standings rows. Teams are ordered on merit, with name
// (stable, alphabetical) as the final display tiebreaker so the list order is
// deterministic even when every metric ties.
//
// Ranks use standard competition ranking: tied teams share the higher rank and
// the following rank is skipped (1, 1, 3), so the table never invents a winner
// out of an alphabetical tiebreak.
export const computeStandings = (teams: Team[]): StandingsRow[] => {
  const rows: UnrankedRow[] = teams.map((team) => {
    const record = team.record ?? EMPTY_RECORD;
    const winPct = getWinPct(record);
    return {
      team,
      wins: record.wins,
      losses: record.losses,
      draws: record.draws,
      gamesPlayed: getGamesPlayed(record),
      winPct,
      winPctLabel: formatWinPct(winPct),
      points: getStandingsPoints(record),
    };
  });

  rows.sort((a, b) => {
    const byMerit = compareOnMerit(a, b);
    if (byMerit !== 0) return byMerit;
    return (a.team.name ?? "").localeCompare(b.team.name ?? "");
  });

  const ranked: StandingsRow[] = [];

  rows.forEach((row, index) => {
    const previous = ranked[index - 1];
    const isTiedWithPrevious =
      index > 0 && compareOnMerit(rows[index - 1], row) === 0;

    ranked.push({
      ...row,
      rank: isTiedWithPrevious ? previous.rank : index + 1,
    });
  });

  return ranked;
};

const PODIUM_SIZE = 3;

// Arranges the top of the table into podium tiles, left to right.
//
// With an outright leader and three or more teams the classic podium applies:
// runner-up, leader (raised), third. Smaller leagues still get a podium — a
// two-team league shows both teams and a one-team league shows the one team,
// rather than the section vanishing.
//
// When the top rank is shared, no team is raised and the tiles stay in standings
// order: the table would otherwise crown whichever co-leader happened to sort
// first alphabetically.
export const getPodiumTiles = (standings: StandingsRow[]): PodiumTile[] => {
  const contenders = standings.slice(0, PODIUM_SIZE);

  if (contenders.length === 0) return [];

  const [first, second, third] = contenders;
  const hasSharedLead = contenders.length > 1 && second.rank === first.rank;

  if (hasSharedLead) {
    return contenders.map((row) => ({ row, highlighted: false }));
  }

  if (contenders.length < PODIUM_SIZE) {
    return contenders.map((row) => ({ row, highlighted: row === first }));
  }

  return [
    { row: second, highlighted: false },
    { row: first, highlighted: true },
    { row: third, highlighted: false },
  ];
};

// Shown in place of a value that has nothing to report yet.
const NO_VALUE = "—";

// Summarises the standings for the tiles above the table. Every figure is
// derived from the rows being rendered — notably the team count, which is the
// number of teams in the table rather than the league's member count, so the
// tile can't contradict what's on screen when a member has no league team yet.
export const getLeagueSummaryStats = (
  standings: StandingsRow[],
): LeagueSummaryStats => {
  const leaders = standings.filter((row) => row.rank === 1);

  return {
    teamCount: standings.length,
    mostGamesPlayed: standings.reduce(
      (max, row) => Math.max(max, row.gamesPlayed),
      0,
    ),
    leaderLabel: getLeaderLabel(leaders),
  };
};

const getLeaderLabel = (leaders: StandingsRow[]): string => {
  if (leaders.length === 0) return NO_VALUE;
  if (leaders.length === 1) return leaders[0].team.name ?? NO_VALUE;
  return `${leaders.length}-way tie`;
};
