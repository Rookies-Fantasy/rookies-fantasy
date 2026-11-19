import { View, Text } from "react-native";
import { cn } from "@/utils/jsUtils";
import { getPlayerInitials } from "@/utils/nbaDisplayUtils";

// Original placeholder used instead of NBA-owned player headshots
// (App Store Guideline 5.2).
const SIZE_CLASSES = {
  md: { container: "size-14", text: "pbk-h7" },
  lg: { container: "size-16", text: "pbk-h6" },
  xl: { container: "size-24", text: "pbk-h4" },
} as const;

type PlayerAvatarProps = {
  firstName: string;
  lastName: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
};

const PlayerAvatar = ({
  firstName,
  lastName,
  size = "md",
  className = "",
}: PlayerAvatarProps) => (
  <View
    className={cn(
      "items-center justify-center rounded-full border border-primary-700 bg-primary-950",
      SIZE_CLASSES[size].container,
      className,
    )}
  >
    <Text className={cn(SIZE_CLASSES[size].text, "text-primary-200")}>
      {getPlayerInitials(firstName, lastName)}
    </Text>
  </View>
);

export default PlayerAvatar;
