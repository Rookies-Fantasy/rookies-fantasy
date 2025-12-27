import { useEffect, useState } from "react";

/**
 * useCountdown
 * @param targetISO ISO string of target time
 * @param intervalMs optional update interval in ms (default: 60 seconds)
 */
export const useCountdown = (
  targetISO: string | undefined,
  intervalMs: number = 60 * 1000,
) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
  }>();

  useEffect(() => {
    if (!targetISO) {
      setTimeRemaining(undefined);
      return;
    }

    const updateTime = () => {
      const now = Date.now();
      const target = new Date(targetISO).getTime();
      const diffMs = Math.max(target - now, 0);

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setTimeRemaining({ hours, minutes });
    };

    updateTime();
    const interval = setInterval(updateTime, intervalMs);

    return () => clearInterval(interval);
  }, [targetISO, intervalMs]);

  return timeRemaining;
};
