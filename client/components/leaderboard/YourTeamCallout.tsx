import { Image, Text, View } from "react-native";
import { useAppSelector } from "@/state/hooks";
import { selectTeam } from "@/state/slices/teamSlice";
import { StandingsRow } from "@/types/standings";
import { formatRecord } from "@/utils/standingsUtils";
import { getTeamLogoSource } from "@/utils/teamUtils";

type YourTeamCalloutProps = {
  standings: StandingsRow[];
};

// Highlights where the signed-in user's team currently sits in the standings.
// Renders nothing when the active team isn't part of this league (e.g. data still
// loading or a mismatched context).
const YourTeamCallout = ({ standings }: YourTeamCalloutProps) => {
  const activeTeam = useAppSelector(selectTeam);
  const row = standings.find((r) => r.team.id === activeTeam.id);

  if (!row) return null;

  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-primary-500 bg-gray-920 p-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-500/20">
        <Text className="pbk-h6 text-primary-300">#{row.rank}</Text>
      </View>
      <Image
        className="h-12 w-12 rounded-full border-2"
        source={getTeamLogoSource(row.team.logoUrl)}
      />
      <View className="flex-1">
        <Text className="pbk-b3 text-gray-400">Your team</Text>
        <Text className="pbk-b1 text-base-white" numberOfLines={1}>
          {row.team.name}
        </Text>
      </View>
      <View className="items-end">
        <Text className="pbk-b1 text-base-white">{formatRecord(row.team)}</Text>
        <Text className="pbk-b3 text-gray-400">
          {row.rank} of {standings.length}
        </Text>
      </View>
    </View>
  );
};

export default YourTeamCallout;
