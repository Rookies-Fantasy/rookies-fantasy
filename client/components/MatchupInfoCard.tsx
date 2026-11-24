import { Sword } from "phosphor-react-native";
import { Text, View } from "react-native";
import { useLineupLock } from "@/hooks/useLineupLock";
import { useAppSelector } from "@/state/hooks";
import { selectMatchup } from "@/state/slices/matchupSlice";
import { LineupLockState } from "@/types/schedule";
import { QueueStatus } from "@/types/user";

const MATCHUP_MESSAGE =
  "Track your players' performance and tweak your strategy as the matchup unfolds.";

const getCardContent = (state: LineupLockState) => {
  switch (state.status) {
    case "loading":
      return {
        title: "Calculating lock time…",
        message: MATCHUP_MESSAGE,
      };
    case "scheduled": {
      const { hours, minutes } = state.countdown;
      const hoursLabel = hours > 0 ? `${hours}h ` : "";
      return {
        title: `Lineup locks in ${hoursLabel}${minutes}m`,
        message: MATCHUP_MESSAGE,
      };
    }
    case "locked":
      return {
        title: "Your lineup is locked",
        message:
          "Games have already started today. Your lineup is locked until tomorrow.",
      };
    case "no-games":
      return {
        title: "No games scheduled today",
        message:
          "There are no NBA games today. Your lineup will unlock when games are scheduled.",
      };
    case "error":
      return {
        title: "Unable to load game schedule",
        message:
          "We could not load today’s game schedule. Please try again later.",
      };
  }
};

const MatchupInfoCard = () => {
  const queueStatus = useAppSelector((state) => state.user.queueStatus);
  const matchup = useAppSelector(selectMatchup);

  const { state } = useLineupLock({
    matchupStartDate: matchup?.weekStart,
  });

  if (queueStatus !== QueueStatus.Matched || !matchup) {
    return null;
  }

  const { title, message } = getCardContent(state);

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
