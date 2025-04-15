import { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { X, Eye, EyeSlash, WarningCircle } from "phosphor-react-native";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import GoogleLogo from "@/assets/icons/google.svg";
import AppleLogo from "@/assets/icons/apple.svg";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
  FormControl,
  FormControlError,
  FormControlLabel,
} from "@/components/ui/form-control";
import { VStack } from "@/components/ui/vstack";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

type FormData = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const [hidePassword, setHidePassword] = useState(true);
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
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      console.log("Login attempt with:", data);

      const loginSuccess = false;

      if (!loginSuccess) {
        setErrorMessage(
          "Password is incorrect. Try again or click on Forgot password to reset it.",
        );
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
          className="flex-1 flex-col px-6 py-4"
        >
          <View className="my-16 size-8 items-center justify-center self-end rounded-md border border-gray-900 p-4">
            <X size={20} color="white" weight="bold" />
          </View>

          <FormControl
            isInvalid={!!errors.email || !!errors.password || !!errorMessage}
          >
            <VStack space="xl">
              <Text className="pbk-h5 mb-8 text-base-white">Login</Text>

              <VStack space="xs">
                <FormControlLabel>
                  <Text className="pbk-b2 mb-1.5 text-base-white">Email</Text>
                </FormControlLabel>

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      className={`mb-4 min-h-14 w-full rounded-xl border ${errors.email ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                    >
                      <InputField
                        placeholder="Enter email"
                        value={value}
                        autoCapitalize="none"
                        onChangeText={(text) => {
                          onChange(text);
                          setErrorMessage("");
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
                {errors.email && (
                  <FormControlError>
                    <Text className="pbk-b3 text-red-600">
                      {errors.email.message}
                    </Text>
                  </FormControlError>
                )}
              </VStack>
              <VStack space="xs">
                <FormControlLabel>
                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    Password
                  </Text>
                </FormControlLabel>

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      className={`min-h-14 flex-row items-center justify-between rounded-xl border ${errors.password || errorMessage ? "border-red-600" : "border-gray-920"} px-3 py-2`}
                    >
                      <InputField
                        placeholder="Enter password"
                        className="text-base-white placeholder:pbk-b1"
                        placeholderTextColor="gray"
                        type={hidePassword ? "password" : "text"}
                        secureTextEntry={hidePassword}
                        value={value}
                        onChangeText={(text) => {
                          onChange(text);
                          setErrorMessage("");
                        }}
                      />
                      <InputSlot
                        className="flex-row gap-2"
                        onPress={() => setHidePassword(!hidePassword)}
                      >
                        {hidePassword ? (
                          <EyeSlash size={20} color="gray" weight="bold" />
                        ) : (
                          <Eye size={20} color="gray" weight="bold" />
                        )}
                        {(errors.password || errorMessage) && (
                          <WarningCircle size={20} color="red" weight="bold" />
                        )}
                      </InputSlot>
                    </Input>
                  )}
                />
                <View className="mb-5">
                  {errors.password && (
                    <FormControlError>
                      <Text className="pbk-b3 text-red-600">
                        {errors.password.message}
                      </Text>
                    </FormControlError>
                  )}
                  {errorMessage && (
                    <FormControlError>
                      <Text className="pbk-b3 text-red-600">
                        {errorMessage}
                      </Text>
                    </FormControlError>
                  )}
                </View>
              </VStack>
              <Button
                action="primary"
                disabled={!isValid || isLoading}
                className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full rounded-md`}
                onPress={handleSubmit(onSubmit)}
              >
                <Text
                  className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
                >
                  LOGIN
                </Text>
              </Button>
            </VStack>
          </FormControl>

          <Text
            className="pbk-b1 py-5 text-center text-purple-600"
            onPress={() => router.push("/forgotPassword")}
          >
            Forgot password?
          </Text>

          <View className="flex-row items-center gap-2 pb-5">
            <Divider className="flex-1 bg-gray-800" />
            <Text className="pbk-b1 text-center text-gray-800">or</Text>
            <Divider className="flex-1 bg-gray-800" />
          </View>

          <TouchableOpacity
            className="mb-4 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920"
            onPress={() => router.push("/signUp")}
          >
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
