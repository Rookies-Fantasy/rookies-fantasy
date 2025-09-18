import { View, Text, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useAppSelector } from "@/state/hooks";
import {
  selectAugment,
  selectAugmentValidation,
} from "@/state/slices/teamSlice";
import { cn } from "@/utils/jsUtils";

type AugmentCardProps = {
  className?: string;
};

const AugmentCard = ({ className }: AugmentCardProps) => {
  const augment = useAppSelector(selectAugment);
  const validation = useAppSelector(selectAugmentValidation);

  return (
    <View className={cn("relative mb-4", className)}>
      <LinearGradient
        colors={["#CCE8FE", "#CDA0FF", "#8489F5", "#CDF1FF", "#B591E9"]}
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
      <View className="w-full gap-3 rounded-xl bg-gray-900 p-4">
        {augment && (
          <>
            <View className="flex-row items-center gap-3">
              <Image
                className="h-12 w-12 rounded-lg"
                resizeMode="cover"
                source={{ uri: augment.iconUrl }}
              />
              <View className="flex-1">
                <Text className="pbk-b1 text-lg text-base-white">
                  {augment.title}
                </Text>
                <Text className="pbk-r text-sm text-gray-400">
                  {augment.description}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="pbk-b1 text-base-white">Qualifying Players</Text>
            </View>

            {augment.info && (
              <Text className="pbk-r text-sm text-gray-300">
                {augment.info}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default AugmentCard;
