import { TEAM_BALANCE } from "../../../client/types/team.js";
import type { LeagueDoc } from "../types/firestore.js";

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
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
};
