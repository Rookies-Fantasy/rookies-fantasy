import type { MatchupDoc, TeamDoc } from "../types/firestore.js";

const getThisMondayString = (): string => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
};

const buildTeamSnapshot = (team: TeamDoc): MatchupDoc["homeTeamSnapshot"] => ({
  name: team.name ?? "Test Team",
  logoUrl: team.logoUrl ?? "",
  record: team.record ?? { wins: 0, losses: 0, draws: 0 },
  augmentSnapshot: team.augment,
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
  homeScore: overrides.homeScore,
  awayScore: overrides.awayScore,
  winnerId: overrides.winnerId,
});
