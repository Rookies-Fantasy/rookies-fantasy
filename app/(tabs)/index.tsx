import EditScreenInfo from "@/components/EditScreenInfo";
import { View, Text } from "react-native";

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-base-white">
      <Text className="pbk-h6 text-gray-950">Tab One</Text>
      <View className="my-30 h-16" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}
