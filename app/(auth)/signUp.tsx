import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import {
  FormControl,
  FormControlError,
  FormControlLabel,
} from "@/components/ui/form-control";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
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
} from "react-native";
import GoogleLogo from "@/assets/icons/google.svg";
import AppleLogo from "@/assets/icons/apple.svg";
import * as yup from "yup";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, LinkText } from "@/components/ui/link";

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type FormData = {
  email: string;
  password: string;
};

export default function SignUpScreen() {
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      email: "test@gmail.com",
      password: "1234",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
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

          <FormControl
            isInvalid={!!errors.email || !!errors.password || !!errorMessage}
          >
            <VStack space="xl">
              <Text className="pbk-h5 mb-8 text-base-white">
                Create an account
              </Text>

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
                        <WarningCircle
                          size={20}
                          color="#dc2626"
                          weight="bold"
                        />
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
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setHidePassword(!hidePassword)}
                        className="ml-2"
                      >
                        {hidePassword ? (
                          <EyeSlash size={20} color="gray" weight="bold" />
                        ) : (
                          <Eye size={20} color="gray" weight="bold" />
                        )}
                        {(errors.password || errorMessage) && (
                          <WarningCircle
                            size={20}
                            color="#dc2626"
                            weight="bold"
                          />
                        )}
                      </TouchableOpacity>
                    </Input>
                  )}
                />
                <View className="mb-5">
                  <Text
                    className={`pbk-b3 ${errors.password || errorMessage ? "text-red-600" : "text-gray-600"}`}
                  >
                    {errors.password ? (
                      <FormControlError>
                        {errors.password.message}
                      </FormControlError>
                    ) : (
                      "Password must be at least 8 characters"
                    )}
                  </Text>
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
                  SIGN UP
                </Text>
              </Button>
            </VStack>
          </FormControl>

          <View className="pbk-b1 my-5 flex-row flex-wrap">
            <Text className="text-gray-600">
              By signing up, you agree to our
            </Text>
            <TouchableOpacity>
              <Text className="text-purple-600"> Terms of Service</Text>
            </TouchableOpacity>
            <Text className="text-gray-600"> and </Text>
            <TouchableOpacity>
              <Text className="text-purple-600">Privacy Policy</Text>
            </TouchableOpacity>
            <Text className="text-gray-600">.</Text>
          </View>

          <View className="mb-5 flex-row items-center gap-2">
            <Divider className="flex-1 bg-gray-800" />
            <Text className="pbk-b1 text-center text-gray-800">or</Text>
            <Divider className="flex-1 bg-gray-800" />
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
