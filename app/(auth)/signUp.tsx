import { Eye, EyeSlash, WarningCircle, X } from "phosphor-react-native";
import { Controller, useForm } from "react-hook-form";
import { router } from "expo-router";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
} from "react-native";
import GoogleLogo from "@/assets/icons/google.svg";
import AppleLogo from "@/assets/icons/apple.svg";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 88 characters"),
});

export type SignUpFormProps = {
  email: string;
  password: string;
};

export default function SignUpScreen() {
  const [hidePassword, setHidePassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignUpFormProps>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async () => {
    router.push("/(auth)/(signUp)/createProfile");
  };

  return (
    <View className="flex-1 bg-gray-950">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col px-6 py-4"
        >
          <TouchableOpacity
            className="my-16 size-8 items-center justify-center self-end rounded-md border border-gray-900 p-4"
            onPress={() => router.back()}
          >
            <X size={20} color="white" weight="bold" />
          </TouchableOpacity>

          <Text className="pbk-h5 mb-8 text-base-white">Create an account</Text>
          <Text className="pbk-b2 mb-1.5 text-base-white">Email</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View
                className={`mb-1 min-h-14 w-full flex-row items-center rounded-xl border ${errors.email ? "border-red-600" : "border-gray-920"} px-2 py-2`}
              >
                <TextInput
                  placeholder="Enter email"
                  value={value}
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    onChange(text);
                    setErrorMessage("");
                  }}
                  className="flex-1 text-base-white placeholder:pbk-b1"
                  placeholderTextColor="gray"
                />
                {errors.email && (
                  <WarningCircle size={20} color="#dc2626" weight="bold" />
                )}
              </View>
            )}
          />
          {errors.email && (
            <Text className="pbk-b3 mb-4 text-red-600">
              {errors.email.message}
            </Text>
          )}
          <Text className="pbk-b2 mb-1.5 text-base-white">Password</Text>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View
                className={`mb-1 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.password || errorMessage ? "border-red-600" : "border-gray-920"} px-3 py-2`}
              >
                <TextInput
                  placeholder="Enter password"
                  className="flex-1 text-base-white placeholder:pbk-b1"
                  placeholderTextColor="gray"
                  secureTextEntry={hidePassword}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setErrorMessage("");
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setHidePassword(!hidePassword)}
                  className="ml-2 flex-row gap-2"
                >
                  {hidePassword ? (
                    <EyeSlash size={20} color="gray" weight="bold" />
                  ) : (
                    <Eye size={20} color="gray" weight="bold" />
                  )}
                  {(errors.password || errorMessage) && (
                    <WarningCircle size={20} color="#dc2626" weight="bold" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
          <View className="mb-5">
            <Text
              className={`pbk-b3 ${errors.password || errorMessage ? "text-red-600" : "text-gray-600"}`}
            >
              {errors.password
                ? errors.password.message
                : "Password must be at least 8 characters"}
            </Text>
            {errorMessage && (
              <Text className="pbk-b3 mb-4 text-red-600">{errorMessage}</Text>
            )}
          </View>
          <TouchableOpacity
            disabled={!isValid}
            className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full justify-center rounded-md`}
            onPress={handleSubmit(onSubmit)}
          >
            <Text
              className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
            >
              SIGN UP
            </Text>
          </TouchableOpacity>

          <View className="pbk-b1 my-5 flex-row flex-wrap">
            <Text className="text-gray-600">
              By signing up, you agree to our
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-purple-600"> Terms of Service</Text>
            </TouchableOpacity>
            <Text className="text-gray-600"> and </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-purple-600">Privacy Policy</Text>
            </TouchableOpacity>
            <Text className="text-gray-600">.</Text>
          </View>

          <View className="mb-5 flex-row items-center gap-2">
            <View className="flex-1 bg-gray-800" />
            <Text className="pbk-b1 text-center text-gray-800">or</Text>
            <View className="flex-1 bg-gray-800" />
          </View>

          <TouchableOpacity className="mb-4 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920">
            <GoogleLogo width={20} height={20} />
            <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920">
            <AppleLogo width={20} height={20} />
            <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
