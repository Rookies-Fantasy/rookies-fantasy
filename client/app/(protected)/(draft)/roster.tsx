import { useRouter } from "expo-router";
import { ArrowLeft, X } from "phosphor-react-native";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TeamBudget from "@/components/TeamBudget";

const Roster = () => {
  const router = useRouter();

  return (
    <SafeAreaView
      className="flex-1 bg-gray-950"
      edges={["top", "right", "left"]}
    >
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView className="flex-1">
          <View className="px-6">
            <View className="mb-10 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Pressable
                  className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                  onPress={() => router.back()}
                >
                  <ArrowLeft color="white" size={20} weight="bold" />
                </Pressable>
                <Text className="pbk-h5 text-base-white">Team builder</Text>
              </View>
              <Pressable
                className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                onPress={() => router.dismissAll()}
              >
                <X color="white" size={20} weight="bold" />
              </Pressable>
            </View>

            <TeamBudget />
          </View>
          <Text className="pbk-h6 text-base-white">Roster</Text>
          <View className="my-30 h-16" />
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Roster;
