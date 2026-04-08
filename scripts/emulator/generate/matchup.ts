import type { MatchupDoc, TeamDoc } from "../types/firestore.js";

function getThisMondayString(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const date = String(monday.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

/**
 * Creates a matchup document.
 * homeUserId/homeTeamId/awayUserId/awayTeamId are required positional args
 * since a matchup cannot exist without them.
 */
export function createMatchupDoc(
  homeUserId: string,
  homeTeamId: string,
  homeTeam: TeamDoc,
  awayUserId: string,
  awayTeamId: string,
  awayTeam: TeamDoc,
  overrides?: Partial<MatchupDoc>
): MatchupDoc {
  const weekStart = getThisMondayString();
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    weekStartDate: weekStart,
    homeTeamId,
    awayTeamId,
    homeUserId,
    awayUserId,
    status: "active",
    homeTeamSnapshot: {
      name: homeTeam.name,
      logoUrl: homeTeam.logoUrl,
      record: homeTeam.record,
      augment: homeTeam.augment ?? null,
    },
    awayTeamSnapshot: {
      name: awayTeam.name,
      logoUrl: awayTeam.logoUrl,
      record: awayTeam.record,
      augment: awayTeam.augment ?? null,
    },
    homeLineupSnapshot: {},
    awayLineupSnapshot: {},
    ...overrides,
  };
}
