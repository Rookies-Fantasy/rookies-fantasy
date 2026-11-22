import { useQuery } from "@tanstack/react-query";
import { LeagueController } from "@/controllers/leagueController";
import { LeagueDeadlineBounds } from "@/types/league";

type UseLeagueDeadlineBoundsResult = {
  bounds: LeagueDeadlineBounds | null;
  isLoading: boolean;
  isError: boolean;
};

export const useLeagueDeadlineBounds = (): UseLeagueDeadlineBoundsResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leagueDeadlineBounds"],
    queryFn: LeagueController.getLeagueDeadlineBounds,
    staleTime: 0,
  });

  return { bounds: data ?? null, isLoading, isError };
};
