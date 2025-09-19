import { View, Text, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { iconMap } from "@/app/(protected)/(draft)/applyAugment";
import { useAppSelector } from "@/state/hooks";
import {
  selectAugment,
  selectQualifyingPlayersCount,
} from "@/state/slices/teamSlice";
import { cn } from "@/utils/jsUtils";

type AugmentCardProps = {
  className?: string;
};

const gradient = ["#CCE8FE", "#CDA0FF", "#8489F5", "#CDF1FF", "#B591E9"];

const AugmentCard = ({ className }: AugmentCardProps) => {
  const augment = useAppSelector(selectAugment);
  const qualifyingPlayersCount = useAppSelector(selectQualifyingPlayersCount);

  return (
    <View className={cn("relative mb-4", className)}>
      <LinearGradient
        colors={gradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          bottom: -3,
          left: -3,
          borderRadius: 12,
          borderWidth: 1,
        }}
      />
      <View className="w-full rounded-xl bg-gray-900 p-4">
        {augment && (
          <View className="flex-col items-center gap-1">
            <View className="flex-row items-center">
              <Image
                className="h-8 w-8 rounded-lg"
                source={iconMap[augment.iconUrl]}
                style={{ tintColor: "#6042FF" }}
              />
              <Text className="pbk-h7 text-purple-500">
                {augment.title.toUpperCase()}
              </Text>
            </View>
            <Text className="pbk-b2 text-base-white">
              {`${qualifyingPlayersCount} / ${augment.playerCount} players meet the condition for this augment`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default AugmentCard;
