import { getAuth } from "@react-native-firebase/auth";
import { CheckCircle, HourglassHigh, Sword } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useCountdown } from "@/hooks/useCountdown";
import { useAppSelector } from "@/state/hooks";
import { QueueStatus } from "@/types/user";

const EARLIEST_GAME_START_TIME_URL =
  "https://us-central1-rookies-fantasy-development.cloudfunctions.net/getEarliestGameStartTime";

const MatchupInfoCard = () => {
  const queueStatus: QueueStatus = useAppSelector(
    (state) => state.user.queueStatus,
  );
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const apiDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const [earliestStartTime, setEarliestStartTime] = useState<string>();

  useEffect(() => {
    if (queueStatus === QueueStatus.Queued) return;

    const fetchEarliestGameTime = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("No authenticated user");
          return;
        }

        const idToken = await currentUser.getIdToken();

        const response = await fetch(
          `${EARLIEST_GAME_START_TIME_URL}?date=2025-12-25`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        );

        const data = await response.json();
        console.log("DATA", data);

        setEarliestStartTime(data.earliestGameStart);
      } catch (error) {
        console.log("Failed to fetch earliest game start time:", error);
      }
    };

    fetchEarliestGameTime();
  }, [apiDate, queueStatus]);

  const countdown = useCountdown(
    queueStatus === QueueStatus.Idle ? earliestStartTime : undefined,
  );

  const statusConfig = {
    [QueueStatus.Idle]: {
      icon: <HourglassHigh color="white" size={20} weight="bold" />,
      title: countdown
        ? `Lineup locks in ${countdown.hours > 0 ? `${countdown.hours}h ` : ""}${countdown.minutes}m`
        : "Calculating lock time…",
      message: `Your lineup locks for Today (${formattedDate})'s games once they start. Set your team before then.`,
    },
    [QueueStatus.Queued]: {
      icon: <CheckCircle color="white" size={20} weight="bold" />,
      title: "You're in queue",
      message:
        "Matchmaking in progress. Leave queue if you want to edit your roster.",
    },
    [QueueStatus.Matched]: {
      icon: <Sword color="white" size={20} weight="bold" />,
      title: "You're in a matchup!",
      message:
        "Track your players’ performance and tweak your strategy as the week unfolds.",
    },
  };

  const { icon, title, message } = statusConfig[queueStatus];

  return (
    <View className="w-full rounded-2xl bg-gray-900 p-4">
      <View className="flex-row items-center gap-3">
        {icon}

        <View className="flex-1">
          <Text className="pbk-b2 text-base-white">{title}</Text>
          <Text className="pbk-b3 text-base-white">{message}</Text>
        </View>
      </View>
    </View>
  );
};

export default MatchupInfoCard;
