import { Image, Text, View } from "react-native";
import { StandingsRow } from "@/types/standings";
import { cn } from "@/utils/jsUtils";
import { formatRecord, getPodiumTiles } from "@/utils/standingsUtils";
import { getTeamLogoSource } from "@/utils/teamUtils";

type PodiumTileProps = {
  row: StandingsRow;
  highlighted?: boolean;
};

const PodiumTile = ({ row, highlighted = false }: PodiumTileProps) => (
  <View
    className={cn(
      "flex-1 items-center rounded-2xl border p-3",
      highlighted
        ? "border-purple-600 bg-purple-900 pb-6 pt-5"
        : "border-gray-900 bg-gray-920",
    )}
  >
    <View
      className={cn(
        "mb-2 h-7 w-7 items-center justify-center rounded-full",
        highlighted ? "bg-primary-500" : "bg-gray-800",
      )}
    >
      <Text className="pbk-h8 text-base-white">{row.rank}</Text>
    </View>
    <Image
      className={cn(
        "rounded-full border-2",
        highlighted ? "h-16 w-16" : "h-12 w-12",
      )}
      source={getTeamLogoSource(row.team.logoUrl)}
    />
    <Text className="pbk-b1 mt-2 text-center text-base-white" numberOfLines={1}>
      {row.team.name}
    </Text>
    <Text className="pbk-b3 text-gray-400">{formatRecord(row.team)}</Text>
    <Text className="pbk-sh3 mt-1 text-primary-300">{row.points} PTS</Text>
  </View>
);

type StandingsPodiumProps = {
  standings: StandingsRow[];
};

// Top-of-the-table spotlight. The tile order and which team (if any) is raised
// are decided by getPodiumTiles, so smaller leagues still get a podium and a
// shared lead isn't presented as an outright win.
const StandingsPodium = ({ standings }: StandingsPodiumProps) => {
  const tiles = getPodiumTiles(standings);

  if (tiles.length === 0) return null;

  return (
    <View className="flex-row items-end gap-3">
      {tiles.map(({ row, highlighted }) => (
        <PodiumTile highlighted={highlighted} key={row.team.id} row={row} />
      ))}
    </View>
  );
};

export default StandingsPodium;
