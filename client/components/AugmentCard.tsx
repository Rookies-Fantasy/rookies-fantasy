import { View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { cn } from "@/utils/jsUtils";

type AugmentCardProps = {
  className?: string;
};

const AugmentCard = ({ className }: AugmentCardProps) => {
  let s = 1;
  return (
    <View
      className={cn(
        "w-full gap-1 rounded-lg border border-gray-800 bg-gray-900 p-4",
        className,
      )}
    >
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
        }}
      />
    </View>
  );
};

export default AugmentCard;
