import { TEAM_BALANCE } from "../../../client/types/team.js";
import type { LeagueDoc } from "../types/firestore.js";

const DEFAULT_DEADLINE_LEAD_DAYS = 7;

export const pacificDateFromToday = (days: number): string => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const createLeagueDoc = (
  overrides: Partial<LeagueDoc> & Pick<LeagueDoc, "creatorUserId">,
): LeagueDoc => {
  const userIds = overrides.userIds ?? [overrides.creatorUserId];

  return {
    name: overrides.name ?? "Dev League",
    creatorUserId: overrides.creatorUserId,
    numberOfTeams: overrides.numberOfTeams ?? 4,
    budget: overrides.budget ?? TEAM_BALANCE,
    memberCount: overrides.memberCount ?? userIds.length,
    teamIds: overrides.teamIds ?? [],
    userIds,
    deadline:
      overrides.deadline ?? pacificDateFromToday(DEFAULT_DEADLINE_LEAD_DAYS),
    status: overrides.status ?? "forming",
    playoffTeams: overrides.playoffTeams ?? null,
    regularSeasonWeeks: overrides.regularSeasonWeeks ?? null,
    playoffStartWeek: overrides.playoffStartWeek ?? null,
    teamOwners: overrides.teamOwners ?? {},
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
};
