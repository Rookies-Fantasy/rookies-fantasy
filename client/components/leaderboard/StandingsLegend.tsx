import { Text, View } from "react-native";

const LEGEND: { abbr: string; meaning: string }[] = [
  { abbr: "W / L / D", meaning: "Wins / Losses / Draws" },
  { abbr: "GP", meaning: "Games played" },
  { abbr: "WIN%", meaning: "Win percentage" },
  { abbr: "PTS", meaning: "Standings points (3 per win, 1 per draw)" },
];

// Explains the standings-table abbreviations below the grid.
const StandingsLegend = () => (
  <View className="gap-2 rounded-2xl border border-gray-900 bg-gray-920 p-4">
    <Text className="pbk-sh3 text-gray-400">LEGEND</Text>
    {LEGEND.map(({ abbr, meaning }) => (
      <View className="flex-row gap-2" key={abbr}>
        <Text className="pbk-b3 w-24 text-base-white">{abbr}</Text>
        <Text className="pbk-b3 flex-1 text-gray-400">{meaning}</Text>
      </View>
    ))}
  </View>
);

export default StandingsLegend;
