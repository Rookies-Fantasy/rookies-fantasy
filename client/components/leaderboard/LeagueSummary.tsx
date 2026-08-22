import { Text, View } from "react-native";
import { StandingsRow } from "@/types/standings";
import { getLeagueSummaryStats } from "@/utils/standingsUtils";

type StatTileProps = {
  label: string;
  value: string;
};

const StatTile = ({ label, value }: StatTileProps) => (
  <View className="flex-1 rounded-2xl border border-gray-900 bg-gray-920 p-4">
    <Text className="pbk-b1 text-base-white" numberOfLines={1}>
      {value}
    </Text>
    <Text className="pbk-b3 text-gray-400">{label}</Text>
  </View>
);

type LeagueSummaryProps = {
  standings: StandingsRow[];
};

// Compact stat row above the standings table. Every figure comes from the same
// standings rows the table renders, so the tiles always agree with what's
// visible below them.
const LeagueSummary = ({ standings }: LeagueSummaryProps) => {
  const { teamCount, mostGamesPlayed, leaderLabel } =
    getLeagueSummaryStats(standings);

  return (
    <View className="flex-row gap-3">
      <StatTile label="Teams" value={String(teamCount)} />
      <StatTile label="Most games played" value={String(mostGamesPlayed)} />
      <StatTile label="Leader" value={leaderLabel} />
    </View>
  );
};

export default LeagueSummary;
