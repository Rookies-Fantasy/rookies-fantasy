import type { MatchupDoc, TeamDoc } from "../types/firestore.js";

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

const buildTeamSnapshot = (team: TeamDoc): MatchupDoc["homeTeamSnapshot"] => ({
  name: team.name ?? "Test Team",
  logoUrl: team.logoUrl ?? "",
  record: team.record ?? { wins: 0, losses: 0, draws: 0 },
  ...(team.augment ? { augmentSnapshot: team.augment } : {}),
});

export const createMatchupDoc = (
  homeUserId: string,
  homeTeamId: string,
  homeTeam: TeamDoc,
  awayUserId: string,
  awayTeamId: string,
  awayTeam: TeamDoc,
  overrides: Partial<MatchupDoc> = {},
): MatchupDoc => ({
  id: overrides.id ?? crypto.randomUUID(),
  createdAt: overrides.createdAt ?? new Date(),
  weekStart: overrides.weekStart ?? getThisMondayString(),
  status: overrides.status ?? "active",
  homeUserId,
  awayUserId,
  homeTeamId,
  awayTeamId,
  homeTeamSnapshot: overrides.homeTeamSnapshot ?? buildTeamSnapshot(homeTeam),
  awayTeamSnapshot: overrides.awayTeamSnapshot ?? buildTeamSnapshot(awayTeam),
  homeLineupSnapshots: overrides.homeLineupSnapshots ?? {},
  awayLineupSnapshots: overrides.awayLineupSnapshots ?? {},
  ...(overrides.homeScore !== undefined ? { homeScore: overrides.homeScore } : {}),
  ...(overrides.awayScore !== undefined ? { awayScore: overrides.awayScore } : {}),
  ...(overrides.winnerId ? { winnerId: overrides.winnerId } : {}),
});
