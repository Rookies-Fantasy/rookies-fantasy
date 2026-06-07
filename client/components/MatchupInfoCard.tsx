import { Sword } from "phosphor-react-native";
import { Text, View } from "react-native";
import { useLineupLock } from "@/hooks/useLineupLock";
import { useAppSelector } from "@/state/hooks";
import { selectMatchup } from "@/state/slices/matchupSlice";
import { QueueStatus } from "@/types/user";

const MatchupInfoCard = () => {
  const queueStatus = useAppSelector((state) => state.user.queueStatus);
  const matchup = useAppSelector(selectMatchup);

  const { isLineupLocked, countdown } = useLineupLock({
    matchupStartDate: matchup?.weekStart,
  });

  const title = isLineupLocked
    ? "Your lineup is locked"
    : countdown
      ? `Lineup locks in ${
          countdown.hours > 0 ? `${countdown.hours}h ` : ""
        }${countdown.minutes}m`
      : "No games today";

  const message = isLineupLocked
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
