import { useRouter } from "expo-router";
import { Sliders } from "phosphor-react-native";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "@/components/SearchBar";
import TeamBudget from "@/components/TeamBudget";

const Players = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col px-6 py-4"
        >
          <View className="my-12 flex-row items-center justify-between gap-4">
            <Text className="pbk-h5 text-base-white">[S1W1] DRAFT</Text>
            <Pressable
              className="rounded-lg border border-gray-800"
              onPress={() => router.back()}
            >
              <Text className="pbk-h8 p-3 text-white">EXIT DRAFT</Text>
            </Pressable>
          </View>

          <TeamBudget />

          <View className="my-10 w-full flex-row items-center gap-4">
            <View className="flex-1">
              <SearchBar onChangeText={setQuery} value={query} />
            </View>

            <Pressable className="size-12 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">
              <Sliders color="white" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Players;
