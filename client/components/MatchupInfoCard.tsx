import { CheckCircle, HourglassHigh } from "phosphor-react-native";
import { View, Text } from "react-native";
import { useAppSelector } from "@/state/hooks";
import { selectUserQueueStatus } from "@/state/slices/userSlice";
import { QueueStatus } from "@/types/user";

const MatchupInfoCard = () => {
  const queueStatus = useAppSelector(selectUserQueueStatus);
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <View className="w-full rounded-2xl bg-gray-900 p-4">
      <View className="flex-row items-center gap-3">
        {queueStatus === QueueStatus.Queued ? (
          <CheckCircle color="white" size={20} weight="bold" />
        ) : (
          <HourglassHigh color="white" size={20} weight="bold" />
        )}

        {queueStatus === QueueStatus.Queued ? (
          <View className="flex-1">
            <Text className="pbk-b2 text-base-white">{`You're in queue`}</Text>

            <Text className="pbk-b3 text-base-white">
              Matchmaking in progress. Leave queue if you want to edit your
              roster.
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <Text className="pbk-b2 text-base-white">Lineup locks</Text>

            <Text className="pbk-b3 text-base-white">
              {`Your lineup locks for Today (${formattedDate})'s games once they start. Set your team before then.`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MatchupInfoCard;
