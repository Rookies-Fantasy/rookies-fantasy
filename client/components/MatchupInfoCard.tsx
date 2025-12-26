import { Sword } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { fetchEarliestGameStartTime } from "@/controllers/ballDontLieController";
import { useCountdown } from "@/hooks/useCountdown";
import { useAppSelector } from "@/state/hooks";
import { selectMatchup } from "@/state/slices/matchupSlice";
import { QueueStatus } from "@/types/user";

const MatchupInfoCard = () => {
  const queueStatus =
    useAppSelector((state) => state.user.queueStatus) ?? QueueStatus.Idle;
  const matchup = useAppSelector(selectMatchup);

  const matchupStartDate = matchup?.weekStartDate; // YYYY-MM-DD
  const now = new Date();

  const apiDate =
    matchupStartDate && now < new Date(matchupStartDate)
      ? matchupStartDate
      : now.toISOString().split("T")[0];

  const [earliestStartTime, setEarliestStartTime] = useState<string>();
  const isLocked =
    !!earliestStartTime && new Date() >= new Date(earliestStartTime);

  useEffect(() => {
    const getEarliestGame = async () => {
      try {
        const startTime = await fetchEarliestGameStartTime(apiDate);
        setEarliestStartTime(startTime);
      } catch (err) {
        console.log("Failed to fetch earliest game start time", err);
      }
    };

    getEarliestGame();
  }, [apiDate]);

  const countdown = useCountdown(earliestStartTime);

  const title = isLocked
    ? "Your lineup is locked"
    : countdown
      ? `Lineup locks in ${
          countdown.hours > 0 ? `${countdown.hours}h ` : ""
        }${countdown.minutes}m`
      : "Calculating lock time…";

  const message = isLocked
    ? "Games have already started today. Your lineup is locked until tomorrow."
    : "Track your players’ performance and tweak your strategy as the matchup unfolds.";

  if (queueStatus !== QueueStatus.Matched || !matchup) {
    return null;
  }

  return (
    <View className="w-full rounded-2xl bg-gray-900 p-4">
      <View className="flex-row items-center gap-3">
        <Sword color="white" size={20} weight="bold" />

        <View className="flex-1">
          <Text className="pbk-b2 text-base-white">{title}</Text>
          <Text className="pbk-b3 text-base-white">{message}</Text>
        </View>
      </View>
    </View>
  );
};

export default MatchupInfoCard;
