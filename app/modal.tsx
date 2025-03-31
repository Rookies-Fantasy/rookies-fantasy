import { StatusBar } from "expo-status-bar";
import { Platform, View, Text } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-pbk-h5">Modal</Text>
      <View className="my-30 h-16" />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}
