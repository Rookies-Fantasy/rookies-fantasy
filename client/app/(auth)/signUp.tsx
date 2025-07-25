import { yupResolver } from "@hookform/resolvers/yup";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeSlash, WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Pressable,
} from "react-native";
import * as yup from "yup";
import Button from "@/components/Button";
import SSOButtons from "@/components/SSOButtons";

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

type SignUpFormModel = {
  email: string;
  password: string;
};

const SignUp = () => {
  const [hidePassword, setHidePassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<SignUpFormModel>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const signUpUser = async (model: SignUpFormModel) => {
    const { email, password } = model;
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }

      router.replace("/(auth)/emailVerification");
    } catch (error) {
      console.log(error);

      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === "auth/email-already-in-use") {
          setError("email", {
            type: "manual",
            message: "Email already in use. Try logging in.",
          });
        } else {
          setError("email", {
            type: "manual",
            message: "Something went wrong, please try again.",
          });
        }
      } else {
        setError("email", {
          type: "manual",
          message: "Unexpected error occurred.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior="padding" className="flex-col px-6 py-4">
          <View className="my-20 flex-row items-center gap-4">
            <Pressable
              className="size-8 items-center justify-center self-start rounded-md border border-gray-900 p-4"
              onPress={() => router.back()}
            >
              <ArrowLeft color="white" size={20} weight="bold" />
            </Pressable>

            <Text className="pbk-h5 text-base-white">Create an account</Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <>
                <Text className="pbk-b2 mb-1.5 text-base-white">Email</Text>
                <View
                  className={`mb-1 min-h-14 w-full flex-row items-center rounded-xl border ${errors.email ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                >
                  <TextInput
                    autoCapitalize="none"
                    className="flex-1 text-base-white placeholder:pbk-b1"
                    onChangeText={(text) => {
                      onChange(text);
                      setErrorMessage("");
                      clearErrors();
                    }}
                    placeholder="Enter email"
                    placeholderTextColor="gray"
                    value={value}
                  />
                  {errors.email && (
                    <WarningCircle color="#dc2626" size={20} weight="bold" />
                  )}
                </View>
              </>
            )}
          />
          {errors.email && (
            <Text className="pbk-b3 mb-4 text-red-600">
              {errors.email.message}
            </Text>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <>
                <Text className="pbk-b2 mb-1.5 text-base-white">Password</Text>
                <View
                  className={`mb-1 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.password || errorMessage ? "border-red-600" : "border-gray-920"} px-3 py-2`}
                >
                  <TextInput
                    className="flex-1 text-base-white placeholder:pbk-b1"
                    onChangeText={(text) => {
                      onChange(text);
                      setErrorMessage("");
                      clearErrors();
                    }}
                    placeholder="Enter password"
                    placeholderTextColor="gray"
                    secureTextEntry={hidePassword}
                    value={value}
                  />
                  <Pressable
                    className="ml-2 flex-row gap-2"
                    onPress={() => setHidePassword(!hidePassword)}
                  >
                    {hidePassword ? (
                      <EyeSlash color="gray" size={20} weight="bold" />
                    ) : (
                      <Eye color="gray" size={20} weight="bold" />
                    )}
                    {(errors.password || errorMessage) && (
                      <WarningCircle color="#dc2626" size={20} weight="bold" />
                    )}
                  </Pressable>
                </View>
              </>
            )}
          />
          <View className="mb-5">
            <Text
              className={`pbk-b2 ${errors.password || errorMessage ? "text-red-600" : "text-gray-600"}`}
            >
              {errors.password
                ? errors.password.message
                : "Password must be at least 8 characters"}
            </Text>
            {errorMessage && (
              <Text className="pbk-b2 mb-4 text-red-600">{errorMessage}</Text>
            )}
          </View>
          <Button
            isLoading={isLoading}
            onPress={handleSubmit(signUpUser)}
            text="Sign Up"
          />

          <Text className="pbk-b2 my-5 flex-row flex-wrap text-gray-600">
            By signing up, you agree to our
            <Text className="text-purple-600">{` Terms of Service `}</Text> and
            <Text className="text-purple-600">{` Privacy Policy`}</Text>.
          </Text>

          <View className="flex-row items-center gap-2 pb-5">
            <View className="h-px flex-1 bg-gray-800" />
            <Text className="pbk-b1 text-center text-gray-800">or</Text>
            <View className="h-px flex-1 bg-gray-800" />
          </View>

          <SSOButtons />
        </KeyboardAvoidingView>
      </Pressable>
    </View>
  );
};

export default SignUp;
