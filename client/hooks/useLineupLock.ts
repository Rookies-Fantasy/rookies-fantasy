import { useEffect, useMemo, useState } from "react";
import { fetchEarliestGameStartTime } from "@/controllers/ballDontLieController";
import { useCountdown } from "@/hooks/useCountdown";
import { getMidnightPdtFromDate } from "@/utils/dateUtils";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const getEarliestGame = async () => {
      try {
        const startTime = await fetchEarliestGameStartTime(apiDate);
        if (!cancelled) {
          setEarliestStartTime(startTime);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch game schedule");
        }
      }
    };

    getEarliestGame();

    return () => {
      cancelled = true;
    };
  }, [apiDate]);

  const now = new Date();
  const endOfGameDayPdt = getMidnightPdtFromDate(apiDate);

  const isLineupLocked =
    !!earliestStartTime &&
    (now >= new Date(earliestStartTime) ||
      // When local time passes midnight in some timezones, `apiDate` advances to tomorrow
      // and `earliestStartTime` may point to the next game day. This guard ensures we still
      // treat the lineup as locked for the remainder of the current PDT game day.
      new Date(earliestStartTime) >= endOfGameDayPdt) &&
    now < endOfGameDayPdt;

  const countdown = useCountdown(
    isLineupLocked ? undefined : earliestStartTime,
  );

  return {
    isLineupLocked,
    countdown,
    error,
  };
};
