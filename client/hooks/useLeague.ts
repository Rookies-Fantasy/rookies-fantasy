import { useQuery } from "@tanstack/react-query";
import { LeagueController } from "@/controllers/leagueController";
import { League } from "@/types/league";

type UseLeagueResult = {
  league: League | null;
  isLoading: boolean;
  isError: boolean;
};

export const useLeague = (leagueId: string): UseLeagueResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => LeagueController.getLeague(leagueId),
    enabled: leagueId.length > 0,
  });

  return { league: data ?? null, isLoading, isError };
};
