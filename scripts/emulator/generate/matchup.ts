import { faker } from "@faker-js/faker";
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
 * Both weekStartDate and weekStart are set to the same value for compatibility:
 *   - processQueue writes weekStartDate
 *   - updateDailyPlayerData queries on weekStart
 * Both home.augment and home.homeAugment are set since:
 *   - updateDailyPlayerData reads home?.augment
 *   - client code reads home.homeAugment
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
  const homeAugment = homeTeam.augment ?? null;
  const awayAugment = awayTeam.augment ?? null;

  return {
    id: faker.string.uuid(),
    createdAt: now,
    weekStartDate: weekStart,
    weekStart,
    homeTeamId,
    awayTeamId,
    homeUserId,
    awayUserId,
    status: "active",
    home: {
      homeTeamId,
      homeUserId,
      homeTeamName: homeTeam.name,
      homeTeamLogo: homeTeam.logoUrl,
      homeAugment,
      augment: homeAugment,
      homeWeeklyAcquisitionsUsed: 0,
      record: homeTeam.record,
    },
    away: {
      awayTeamId,
      awayUserId,
      awayTeamName: awayTeam.name,
      awayTeamLogo: awayTeam.logoUrl,
      awayAugment,
      augment: awayAugment,
      awayWeeklyAcquisitionsUsed: 0,
      record: awayTeam.record,
    },
    lineupSnapshots: {},
    ...overrides,
  };
}
