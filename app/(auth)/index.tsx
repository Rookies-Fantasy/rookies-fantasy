import { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { X, Eye, EyeSlash } from "phosphor-react-native";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import GoogleLogo from "@/assets/icons/google.svg";
import AppleLogo from "@/assets/icons/apple.svg";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [disabled, setDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1 flex-col px-6 py-4"
      >
        <View className="my-8 size-8 self-end">
          <X size={20} color="white" weight="bold" />
        </View>

        <Text className="pbk-h5 mb-8 text-base-white">Login</Text>

        <Text className="pbk-b2 mb-1.5 text-base-white">Email</Text>

        <TextInput
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          className="p mb-4 h-12 w-full rounded-md border border-gray-920 px-3 py-2 placeholder:pbk-b1 placeholder:text-gray-500"
        />

        <Text className="pbk-b2 mb-1.5 text-base-white">Password</Text>

        <View className="mb-5 flex-row items-center justify-between rounded-md border border-gray-920 px-3 py-2">
          <TextInput
            className="flex-1 placeholder:pbk-b1 placeholder:font-[500] placeholder:text-gray-500"
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
            {hidePassword ? (
              <EyeSlash size={20} color="gray" weight="bold" />
            ) : (
              <Eye size={20} color="white" weight="bold" />
            )}
          </TouchableOpacity>
        </View>

        <Button
          action="primary"
          disabled={disabled}
          className={`${disabled ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full rounded-md`}
          onPress={() => {}}
        >
          <Text
            className={`pbk-h6 text-center ${disabled ? "text-gray-400" : "text-base-white"}`}
          >
            LOGIN
          </Text>
        </Button>

        <Text className="pbk-b1 py-5 text-center text-purple-600">
          Forgot password?
        </Text>

        <View className="flex-row items-center gap-2 pb-5">
          <Divider className="flex-1 bg-gray-800" />
          <Text className="pbk-b1 text-center text-gray-800">or</Text>
          <Divider className="flex-1 bg-gray-800" />
        </View>

        <TouchableOpacity className="mb-4 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border-gray-900 bg-gray-920">
          <GoogleLogo width={20} height={20} />
          <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border-gray-900 bg-gray-920">
          <AppleLogo width={20} height={20} />
          <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
            Continue with Apple
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
