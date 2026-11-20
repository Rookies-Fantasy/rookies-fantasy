import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router";
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

const STANDINGS_STALE_TIME_MS = 5 * 60 * 1000;

// Fetches every team in a league and returns them as ranked standings rows.
// Takes a non-null League: Ranked mode has no league and renders its own
// placeholder instead of mounting this hook.
export const useLeagueStandings = (
  league: League,
): UseLeagueStandingsResult => {
  // Tabs stay mounted, so leaving and returning to the Leaderboard never
  // remounts this hook. Unsubscribing while the screen is out of focus means
  // returning re-subscribes, which refetches only if the standings are stale.
  const isFocused = useIsFocused();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leagueStandings", league.id],
    queryFn: () => LeagueController.getLeagueTeams(league),
    staleTime: STANDINGS_STALE_TIME_MS,
    subscribed: isFocused,
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
