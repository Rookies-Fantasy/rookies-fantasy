import { useEffect } from "react";
import { useLeague } from "@/hooks/useLeague";
import { useAppDispatch } from "@/state/hooks";
import { setCurrentLeague } from "@/state/slices/leagueSlice";
import { League } from "@/types/league";
import { isNotNil } from "@/utils/jsUtils";

export const useSyncedLeague = (storedLeague: League): League => {
  const dispatch = useAppDispatch();
  const { league: freshLeague } = useLeague(storedLeague.id);

  useEffect(() => {
    if (isNotNil(freshLeague)) {
      dispatch(setCurrentLeague(freshLeague));
    }
  }, [dispatch, freshLeague]);

  return freshLeague ?? storedLeague;
};
