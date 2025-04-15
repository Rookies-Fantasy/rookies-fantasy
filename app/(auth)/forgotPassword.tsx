import { VStack } from "@/components/ui/vstack";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { Input, InputField } from "@/components/ui/input";
import {
  FormControl,
  FormControlError,
  FormControlLabel,
} from "@/components/ui/form-control";
import { WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
});

type FormData = {
  email: string;
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
      email: "",
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
          <FormControl isInvalid={!!errors.email}>
            <VStack space="xl">
              <Text className="pbk-h5 mb-4 text-base-white">
                Forgot password?
              </Text>

              <Text className="pbk-b1 text-base-white">
                Enter your email address or username and we will send you a link
                to reset your password.
              </Text>

              <VStack>
                <FormControlLabel className="mb-1.5">
                  <Text className="pbk-b2 text-base-white">Email</Text>
                </FormControlLabel>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      className={`mb-5 min-h-14 w-full rounded-xl border ${errors.email ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                    >
                      <InputField
                        placeholder="Enter email"
                        value={value}
                        autoCapitalize="none"
                        onChangeText={(text) => {
                          onChange(text);
                        }}
                        className="text-base-white placeholder:pbk-b1"
                        placeholderTextColor="gray"
                      />
                      {errors.email && (
                        <WarningCircle size={20} color="red" weight="bold" />
                      )}
                    </Input>
                  )}
                />
              </VStack>

              {errors.email && errorMessage && (
                <FormControlError>
                  <Text className="pbk-b3 text-red-600">
                    {errors.email.message}
                  </Text>
                </FormControlError>
              )}

              <Button
                action="primary"
                disabled={!isValid || isLoading}
                className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full rounded-md`}
                onPress={handleSubmit(onSubmit)}
              >
                <Text
                  className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
                >
                  RESET PASSWORD
                </Text>
              </Button>

              <Text
                className="pbk-b1 mt-5 text-center text-purple-600"
                onPress={() => router.back()}
              >
                Or sign in
              </Text>
            </VStack>
          </FormControl>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
