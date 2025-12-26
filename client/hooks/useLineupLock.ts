import { useEffect, useMemo, useState } from "react";
import { fetchEarliestGameStartTime } from "@/controllers/ballDontLieController";
import { useCountdown } from "@/hooks/useCountdown";

type UseLineupLockArgs = {
  matchupStartDate?: string; // YYYY-MM-DD
};

export const useLineupLock = ({ matchupStartDate }: UseLineupLockArgs) => {
  const apiDate = useMemo(() => {
    const now = new Date();

    if (!matchupStartDate) {
      return now.toISOString().split("T")[0];
    }

    return now < new Date(matchupStartDate)
      ? matchupStartDate
      : now.toISOString().split("T")[0];
  }, [matchupStartDate]);

  const [earliestStartTime, setEarliestStartTime] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const getEarliestGame = async () => {
      try {
        const startTime = await fetchEarliestGameStartTime(apiDate);
        if (!cancelled) {
          setEarliestStartTime(startTime);
        }
      } catch (err) {
        console.log("Failed to fetch earliest game start time", err);
      }
    };

    getEarliestGame();

    return () => {
      cancelled = true;
    };
  }, [apiDate]);

  const isLineupLocked =
    !!earliestStartTime && new Date() >= new Date(earliestStartTime);

  const countdown = useCountdown(
    isLineupLocked ? undefined : earliestStartTime,
  );

  return {
    isLineupLocked,
    countdown,
  };
};
