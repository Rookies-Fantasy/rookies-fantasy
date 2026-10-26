import type {
  LeagueMatchupDoc,
  RankedMatchupDoc,
  TeamDoc,
} from "../types/firestore.js";

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getThisMondayString = (): string => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return formatLocalDate(monday);
};

const buildTeamSnapshot = (
  team: TeamDoc,
): RankedMatchupDoc["homeTeamSnapshot"] => ({
  name: team.name ?? "Test Team",
  logoUrl: team.logoUrl ?? "",
  record: team.record ?? { wins: 0, losses: 0, draws: 0 },
  lineup: team.lineup,
  ...(team.augment ? { augmentSnapshot: team.augment } : {}),
});

export type MatchupSides = {
  homeUserId: string;
  homeTeamId: string;
  homeTeam: TeamDoc;
  awayUserId: string;
  awayTeamId: string;
  awayTeam: TeamDoc;
};

export type LeagueMatchupPlacement = Pick<
  LeagueMatchupDoc,
  "leagueId" | "week" | "phase"
>;

type SharedMatchupFields = Omit<RankedMatchupDoc, "leagueId" | "status">;

const buildSharedFields = (
  sides: MatchupSides,
  overrides: Partial<SharedMatchupFields>,
): SharedMatchupFields => ({
  id: overrides.id ?? crypto.randomUUID(),
  createdAt: overrides.createdAt ?? new Date(),
  weekStart: overrides.weekStart ?? getThisMondayString(),
  homeUserId: sides.homeUserId,
  awayUserId: sides.awayUserId,
  homeTeamId: sides.homeTeamId,
  awayTeamId: sides.awayTeamId,
  homeTeamSnapshot:
    overrides.homeTeamSnapshot ?? buildTeamSnapshot(sides.homeTeam),
  awayTeamSnapshot:
    overrides.awayTeamSnapshot ?? buildTeamSnapshot(sides.awayTeam),
  homeLineupSnapshots: overrides.homeLineupSnapshots ?? {},
  awayLineupSnapshots: overrides.awayLineupSnapshots ?? {},
  ...(overrides.homeScore !== undefined
    ? { homeScore: overrides.homeScore }
    : {}),
  ...(overrides.awayScore !== undefined
    ? { awayScore: overrides.awayScore }
    : {}),
  ...(overrides.winnerId ? { winnerId: overrides.winnerId } : {}),
});

export const createMatchupDoc = (
  sides: MatchupSides,
  overrides: Partial<RankedMatchupDoc> = {},
): RankedMatchupDoc => ({
  ...buildSharedFields(sides, overrides),
  leagueId: null,
  status: overrides.status ?? "active",
});

export const createLeagueMatchupDoc = (
  sides: MatchupSides,
  placement: LeagueMatchupPlacement,
  overrides: Partial<LeagueMatchupDoc> = {},
): LeagueMatchupDoc => ({
  ...buildSharedFields(sides, overrides),
  ...placement,
  status: overrides.status ?? "scheduled",
});
