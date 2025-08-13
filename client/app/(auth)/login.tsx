import { yupResolver } from "@hookform/resolvers/yup";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Eye, EyeSlash, WarningCircle, ArrowLeft } from "phosphor-react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Keyboard,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";
import IconButton from "@/components/IconButton";
import Spinner from "@/components/Spinner";
import SSOButtons from "@/components/SSOButtons";

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

type LoginFormModel = {
  email: string;
  password: string;
};

const Login = () => {
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormModel>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (model: LoginFormModel) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        model.email.trim().toLowerCase(),
        model.password,
      );
    } catch (error) {
      console.log(error);
      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code: string };

        if (
          firebaseError.code === "auth/invalid-email" ||
          firebaseError.code === "auth/wrong-password" ||
          firebaseError.code === "auth/invalid-credential" ||
          firebaseError.code === "auth/user-not-found"
        ) {
          setError("root", {
            type: "manual",
            message: "Invalid email or password. Please try again.",
          });
        } else {
          setError("root", {
            type: "manual",
            message: "Something went wrong. Please try again later.",
          });
        }
      } else {
        setError("root", {
          type: "manual",
          message: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col px-6 py-4"
        >
          <View className="my-20 flex-row items-center gap-4">
            <IconButton
              className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
              icon={<ArrowLeft color="white" size={20} weight="bold" />}
              onPress={() => router.dismissAll()}
            />

            <Text className="pbk-h5 text-base-white">Login</Text>
          </View>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <>
                <Text className="pbk-b2 mb-1.5 text-base-white">Email</Text>
                <View
                  className={`mb-2 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${errors.email ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                >
                  <TextInput
                    autoCapitalize="none"
                    className="flex-1 text-base-white placeholder:pbk-b1"
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    placeholder="Enter email"
                    placeholderTextColor="gray"
                    textAlignVertical="center"
                    value={value}
                  />
                  {errors.email && (
                    <WarningCircle color="red" size={20} weight="bold" />
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
                  className={`mb-1 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.password ? "border-red-600" : "border-gray-920"} px-3 py-2`}
                >
                  <TextInput
                    className="flex-1 text-base-white placeholder:pbk-b1"
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    placeholder="Enter password"
                    placeholderTextColor="gray"
                    secureTextEntry={hidePassword}
                    value={value}
                  />
                  <Pressable
                    className="flex-row gap-2"
                    onPress={() => setHidePassword(!hidePassword)}
                  >
                    {hidePassword ? (
                      <EyeSlash color="gray" size={20} weight="bold" />
                    ) : (
                      <Eye color="gray" size={20} weight="bold" />
                    )}
                    {errors.password && (
                      <WarningCircle color="red" size={20} weight="bold" />
                    )}
                  </Pressable>
                </View>
              </>
            )}
          />
          <View className="mb-5">
            {errors.password && (
              <Text className="pbk-b3 mb-4 text-red-600">
                {errors.password.message}
              </Text>
            )}
            {errors.root && (
              <Text className="pbk-b3 mb-4 text-red-600">
                {errors.root.message}
              </Text>
            )}
          </View>

          <Pressable
            className="min-h-12 w-full items-center justify-center rounded-md bg-purple-600"
            disabled={isLoading}
            onPress={handleSubmit(handleLogin)}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <Text className="pbk-h6 text-center text-base-white">LOGIN</Text>
            )}
          </Pressable>

          <Text
            className="pbk-b1 mx-auto my-5 text-center text-purple-600"
            onPress={() => router.push("/forgotPassword")}
          >
            Forgot password?
          </Text>

          <View className="flex-row items-center gap-2 pb-5">
            <View className="h-px flex-1 bg-gray-800" />
            <Text className="pbk-b1 text-center text-gray-800">or</Text>
            <View className="h-px flex-1 bg-gray-800" />
          </View>

          <SSOButtons />

          <Text className="pbk-b1 my-2 text-center text-gray-600">
            Don&apos;t have an account?
            <Text
              className="text-purple-600"
              onPress={() => router.push("/(auth)/signUp")}
            >
              {` Sign up`}
            </Text>
          </Text>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Login;
