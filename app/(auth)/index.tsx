import { useRouter } from "expo-router";
import {
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  Text,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function AuthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col justify-end gap-4 px-6 py-4"
        >
          <Pressable
            className="min-h-12 w-full justify-center rounded-md bg-purple-600"
            onPress={() => router.back()}
          >
            <Text className="pbk-h5 text-center text-base-white">Back</Text>
          </Pressable>
          <Pressable
            className="min-h-12 w-full justify-center rounded-md bg-purple-600"
            onPress={() => router.push("/login")}
          >
            <Text className="pbk-h5 text-center text-base-white">Login</Text>
          </Pressable>
          <Pressable
            className="min-h-12 w-full justify-center rounded-md bg-purple-900"
            onPress={() => router.push("/signUp")}
          >
            <Text className="pbk-h5 text-center text-base-white">Sign Up</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

export default AuthScreen;
