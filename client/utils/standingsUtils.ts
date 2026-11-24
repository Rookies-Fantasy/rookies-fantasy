import { JsonObject, JsonValue } from "@/types/json";
import {
  DRAW_POINTS,
  EMPTY_RECORD,
  LeagueStandingTeam,
  LeagueSummaryStats,
  PodiumTile,
  StandingsRow,
  WIN_POINTS,
} from "@/types/standings";
import { TeamRecord } from "@/types/team";

type UnrankedRow = Omit<StandingsRow, "rank">;

const PODIUM_SIZE = 3;
const NO_VALUE = "—";

// Renders a team's record as a "W-L-D" label.
export const formatRecord = ({ record }: LeagueStandingTeam): string =>
  `${record.wins}-${record.losses}-${record.draws}`;

const isJsonObject = (value: JsonValue): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: JsonValue): string =>
  typeof value === "string" ? value : "";

const readCount = (value: JsonValue): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;

const toTeamRecord = (value: JsonValue): TeamRecord =>
  isJsonObject(value)
    ? {
        wins: readCount(value.wins),
        losses: readCount(value.losses),
        draws: readCount(value.draws),
      }
    : EMPTY_RECORD;

// Narrows the getLeagueStandings response field by field. A malformed payload
// throws so the screen shows its error state; a malformed team is skipped.
export const parseLeagueStandingTeams = (
  payload: JsonValue,
): LeagueStandingTeam[] => {
  if (!isJsonObject(payload) || !Array.isArray(payload.teams)) {
    throw new Error("Malformed standings response");
  }

  return payload.teams.flatMap((entry) => {
    if (!isJsonObject(entry)) return [];

    const id = readString(entry.id);
    if (id.length === 0) return [];

    return [
      {
        id,
        name: readString(entry.name),
        logoUrl: readString(entry.logoUrl),
        record: toTeamRecord(entry.record),
      },
    ];
  });
};

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

const compareOnMerit = (a: UnrankedRow, b: UnrankedRow): number => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.winPct !== a.winPct) return b.winPct - a.winPct;
  return b.team.record.wins - a.team.record.wins;
};

// Ranks use standard competition ranking: tied teams share the higher rank and
// the following rank is skipped (1, 1, 3), so the table never invents a winner
// out of an alphabetical tiebreak.
export const computeStandings = (
  teams: LeagueStandingTeam[],
): StandingsRow[] => {
  const rows: UnrankedRow[] = teams.map((team) => {
    const { record } = team;
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
    return a.team.name.localeCompare(b.team.name);
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
  if (leaders.length === 1) return leaders[0].team.name || NO_VALUE;
  return `${leaders.length}-way tie`;
};
