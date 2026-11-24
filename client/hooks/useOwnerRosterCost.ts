import { useQuery } from "@tanstack/react-query";
import { UserController } from "@/controllers/userController";
import { League } from "@/types/league";
import { getRosterCost } from "@/utils/leagueUtils";

type UseOwnerRosterCostResult = {
  rosterCost: number;
  isLoading: boolean;
};

// What the owner's saved league roster costs, which is the floor for a new
// budget. Read from the saved team rather than the team builder's state, so it
// matches what the server checks. Skipped (cost 0) when there is no single
// owner team, i.e. once the budget is locked anyway.
export const useOwnerRosterCost = (
  league: League,
  ownerTeamId: string | null,
): UseOwnerRosterCostResult => {
  const { data, isLoading } = useQuery({
    queryKey: ["ownerRosterCost", league.id, ownerTeamId],
    queryFn: async () => {
      const team = await UserController.getUserTeam(
        league.creatorUserId,
        ownerTeamId ?? "",
      );
      return getRosterCost(team);
    },
    enabled: ownerTeamId !== null,
    gcTime: 0,
  });

  return {
    rosterCost: data ?? 0,
    isLoading: ownerTeamId !== null && isLoading,
  };
};
