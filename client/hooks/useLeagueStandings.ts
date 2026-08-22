import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { LeagueController } from "@/controllers/leagueController";
import { League } from "@/types/league";
import { StandingsRow } from "@/types/standings";
import { computeStandings } from "@/utils/standingsUtils";

type UseLeagueStandingsResult = {
  standings: StandingsRow[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

// Standings change when matchups settle — weekly — but the query behind them
// fans out across every team in the league on the server. Five minutes keeps a
// remount or a reconnect from refiring that whole fan-out for data that cannot
// have moved.
const STANDINGS_STALE_TIME_MS = 5 * 60 * 1000;

// Fetches every team in a league and returns them as ranked standings rows.
// Takes a non-null League: Ranked mode has no league and renders its own
// placeholder instead of mounting this hook.
export const useLeagueStandings = (
  league: League,
): UseLeagueStandingsResult => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leagueStandings", league.id],
    queryFn: () => LeagueController.getLeagueTeams(league),
    staleTime: STANDINGS_STALE_TIME_MS,
  });

  const standings = useMemo(() => computeStandings(data ?? []), [data]);

  return {
    standings,
    isLoading,
    isError,
    error,
    refetch,
  };
};
