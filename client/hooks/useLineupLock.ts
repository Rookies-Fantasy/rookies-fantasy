import { useEffect, useMemo, useState } from "react";
import { fetchEarliestGameStartTime } from "@/controllers/ballDontLieController";
import { useCountdown } from "@/hooks/useCountdown";
import { LineupLockState, ScheduleState } from "@/types/schedule";
import { getMidnightPdtFromDate } from "@/utils/dateUtils";

type UseLineupLockArgs = {
  matchupStartDate?: string; // YYYY-MM-DD
};

export const useLineupLock = ({ matchupStartDate }: UseLineupLockArgs) => {
  const apiDate = useMemo((): string | null => {
    if (!matchupStartDate) return null;

    const now = new Date();
    return now < new Date(matchupStartDate)
      ? matchupStartDate
      : now.toISOString().split("T")[0];
  }, [matchupStartDate]);

  const [schedule, setSchedule] = useState<ScheduleState>({
    status: "loading",
  });

  useEffect(() => {
    setSchedule({ status: "loading" });
    if (!apiDate) return;

    let cancelled = false;

    const getEarliestGame = async () => {
      try {
        const startTime = await fetchEarliestGameStartTime(apiDate);
        if (!cancelled) {
          setSchedule(
            startTime === null
              ? { status: "no-games" }
              : { status: "scheduled", startTime },
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unable to load game schedule:", err);
          setSchedule({ status: "error" });
        }
      }
    };

    getEarliestGame();

    return () => {
      cancelled = true;
    };
  }, [apiDate]);

  const earliestStartTime =
    schedule.status === "scheduled" ? schedule.startTime : null;
  const now = new Date();
  const endOfGameDayPdt = apiDate
    ? getMidnightPdtFromDate(apiDate)
    : new Date(0);

  const isLineupLocked =
    !!apiDate &&
    !!earliestStartTime &&
    (now >= new Date(earliestStartTime) ||
      // When local time passes midnight in some timezones, `apiDate` advances to tomorrow
      // and `earliestStartTime` may point to the next game day. This guard ensures we still
      // treat the lineup as locked for the remainder of the current PDT game day.
      new Date(earliestStartTime) >= endOfGameDayPdt) &&
    now < endOfGameDayPdt;

  const countdown = useCountdown(
    isLineupLocked ? undefined : (earliestStartTime ?? undefined),
  );

  let state: LineupLockState = { status: "loading" };
  if (isLineupLocked) {
    state = { status: "locked" };
  } else if (schedule.status !== "scheduled") {
    state = schedule;
  } else if (countdown) {
    state = { status: "scheduled", countdown };
  }

  return {
    isLineupLocked,
    state,
  };
};
