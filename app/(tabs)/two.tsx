import EditScreenInfo from "@/components/EditScreenInfo";
import Typography from "@/components/Typography";
import { View, Text } from "react-native";

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-base-white">
      <Typography variant="h5" color="gray-950">
        Tab Two
      </Typography>
      <View className="my-30 h-16" />
      <EditScreenInfo path="app/(tabs)/two.tsx" />
    </View>
  );
}
