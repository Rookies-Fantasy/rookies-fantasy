import EditScreenInfo from "@/components/EditScreenInfo";
import { View, Text } from "react-native";

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-base-white">
      <Text className={`pbk-h6 text-gray-950`}>Tab Two</Text>
      <View className="my-30 h-16" />
      <EditScreenInfo path="app/(tabs)/two.tsx" />
    </View>
  );
}
