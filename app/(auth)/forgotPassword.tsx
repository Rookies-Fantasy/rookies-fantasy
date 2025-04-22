import {
  View,
  Text,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { router } from "expo-router";

const schema = yup.object({
  emailOrUsername: yup.string().required("Email or username is required"),
});

type FormData = {
  emailOrUsername: string;
};

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      emailOrUsername: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      console.log("Login attempt with:", data);

      const simulatedSuccess = false;

      if (!simulatedSuccess) {
        setErrorMessage("Email is incorrect. Try again.");
      } else {
        // Handle successful login
        // e.g., router.push("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-950">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="my-16 flex-1 flex-col px-6 py-4"
        >
          <Text className="pbk-h5 mb-4 text-base-white">Forgot password?</Text>

          <Text className="pbk-b1 mb-8 text-base-white">
            Enter your email address or username and we will send you a link to
            reset your password.
          </Text>

          <Text className="pbk-b2 mb-1.5 text-base-white">
            Email or username
          </Text>
          <Controller
            control={control}
            name="emailOrUsername"
            render={({ field: { onChange, value } }) => (
              <View
                className={`mb-2 min-h-14 w-full rounded-xl border ${errors.emailOrUsername ? "border-red-600" : "border-gray-920"} px-2 py-2`}
              >
                <TextInput
                  placeholder="Enter email or username"
                  value={value}
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                  className="text-base-white placeholder:pbk-b1"
                  placeholderTextColor="gray"
                />
                {errors.emailOrUsername && (
                  <WarningCircle size={20} color="red" weight="bold" />
                )}
              </View>
            )}
          />

          {errors.emailOrUsername && errorMessage && (
            <Text className="pbk-b3 mb-4 text-red-600">
              {errors.emailOrUsername.message}
            </Text>
          )}

          <TouchableOpacity
            disabled={!isValid || isLoading}
            className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full justify-center rounded-md`}
            onPress={handleSubmit(onSubmit)}
          >
            <Text
              className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
            >
              RESET PASSWORD
            </Text>
          </TouchableOpacity>

          <Text
            className="pbk-b1 mt-5 text-center text-purple-600"
            onPress={() => router.back()}
          >
            Or sign in
          </Text>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
