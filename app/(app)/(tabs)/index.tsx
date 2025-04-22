import EditScreenInfo from "@/components/EditScreenInfo";
import { View, Text, TouchableOpacity } from "react-native";
import auth from "@react-native-firebase/auth";

export default function TabOneScreen() {
  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 flex-col items-center justify-center bg-base-white px-6 py-4">
      <Text className="pbk-h6 text-gray-950">Tab One</Text>
      <View className="my-30 h-16" />
      <TouchableOpacity
        onPress={handleLogout}
        className="min-h-12 w-full justify-center rounded-md bg-purple-600"
      >
        <Text className="pbk-h6 text-center text-base-white">Sign Out</Text>
      </TouchableOpacity>

      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}
