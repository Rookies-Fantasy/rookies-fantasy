import { View, Text } from "react-native";
import { cn } from "@/utils/jsUtils";
import { getTeamBadgeLabel } from "@/utils/nbaDisplayUtils";

// Original placeholder used instead of NBA-owned team logos
// (App Store Guideline 5.2).
type TeamBadgeProps = {
  abbreviation: string;
  teamName: string;
  className?: string;
};

const TeamBadge = ({
  abbreviation,
  teamName,
  className = "",
}: TeamBadgeProps) => (
  <View
    className={cn(
      "h-8 w-14 items-center justify-center rounded-md border border-gray-700 bg-gray-900 px-1",
      className,
    )}
  >
    <Text className="pbk-b2 text-base-white">
      {getTeamBadgeLabel(abbreviation, teamName)}
    </Text>
  </View>
);

export default TeamBadge;
