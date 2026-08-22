import { Ranking } from "phosphor-react-native";
import { Text, View } from "react-native";
import { themes } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";

// Ranked mode has no rating system yet, so the global leaderboard is a styled
// "coming soon" empty state. Mirrors the centered empty-state idiom used in the
// Arena tab.
const RankedLeaderboardPlaceholder = () => {
  const { theme, mode } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-2 px-6">
      <Ranking
        color={`rgb(${themes[theme][mode].modeContrast})`}
        size={40}
        weight="fill"
      />
      <Text className="pbk-h8 text-center text-modeContrast">
        Global Rankings Coming Soon
      </Text>
      <Text className="pbk-b2 text-center text-modeContrast">
        {`We're building a competitive rating system to rank the best teams worldwide. Check back soon — or jump into a league to see live standings.`}
      </Text>
    </View>
  );
};

export default RankedLeaderboardPlaceholder;
