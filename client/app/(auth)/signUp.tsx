import { yupResolver } from "@hookform/resolvers/yup";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "@react-native-firebase/auth";
import { router } from "expo-router";
import { Eye, EyeSlash, WarningCircle, X } from "phosphor-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import * as yup from "yup";
import GoogleLogo from "@/assets/icons/google.svg";
import Spinner from "@/components/Spinner";
import { useAppDispatch } from "@/state/hooks";
import { setUser } from "@/state/slices/userSlice";
import { LoginProvider } from "@/types/providers";
import { signInWithGoogle } from "@/utils/socialAuth";

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

type SignUpFormData = {
  email: string;
  password: string;
};

const SignUp = () => {
  const [hidePassword, setHidePassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const auth = getAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<SignUpFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const signUpWithProvider = async (provider: LoginProvider) => {
    try {
      if (provider === LoginProvider.Google) {
        const { user } = await signInWithGoogle();
        dispatch(
          setUser({
            userId: user.uid,
            email: user.email ?? undefined,
          }),
        );
        router.replace("/(auth)/createProfile");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const signUpUser = async (data: SignUpFormData) => {
    const { email, password } = data;
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (user) {
        await sendEmailVerification(user);
        Alert.alert("Verification email sent!");
      }
      const intervalId = setInterval(async () => {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(intervalId);

          dispatch(
            setUser({
              userId: user.uid,
              email: user.email ?? undefined,
            }),
          );

          setLoading(false);
          router.replace("/(auth)/createProfile");
        }
      }, 3000);
    } catch (error) {
      console.log(error);

      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === "auth/email-already-in-use") {
          setError("email", {
            type: "manual",
            message: "Email already in use",
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
    }
  };

  return (
    <View className="flex-1 bg-gray-950">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col px-6 py-4"
        >
          <Pressable
            className="my-16 size-8 items-center justify-center self-end rounded-md border border-gray-900 p-4"
            onPress={() => router.back()}
          >
            <X color="white" size={20} weight="bold" />
          </Pressable>

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
                  autoCapitalize="none"
                  className="flex-1 text-base-white placeholder:pbk-b1"
                  onChangeText={(text) => {
                    onChange(text);
                    setErrorMessage("");
                  }}
                  placeholder="Enter email"
                  placeholderTextColor="gray"
                  value={value}
                />
                {errors.email && (
                  <WarningCircle color="#dc2626" size={20} weight="bold" />
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
                  className="flex-1 text-base-white placeholder:pbk-b1"
                  onChangeText={(text) => {
                    onChange(text);
                    setErrorMessage("");
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
          <Pressable
            className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full items-center justify-center rounded-md`}
            disabled={!isValid}
            onPress={handleSubmit(signUpUser)}
          >
            {loading ? (
              <Spinner />
            ) : (
              <Text
                className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
              >
                SIGN UP
              </Text>
            )}
          </Pressable>

          <View className="pbk-b1 my-5 flex-row flex-wrap">
            <Text className="text-gray-600">
              By signing up, you agree to our
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-purple-600"> Terms of Service</Text>
            </Pressable>
            <Text className="text-gray-600"> and </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-purple-600">Privacy Policy</Text>
            </Pressable>
            <Text className="text-gray-600">.</Text>
          </View>

          <View className="mb-5 flex-row items-center gap-2">
            <View className="flex-1 bg-gray-800" />
            <Text className="pbk-b1 text-center text-gray-800">or</Text>
            <View className="flex-1 bg-gray-800" />
          </View>

          <Pressable
            className="mb-4 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920"
            onPress={() => signUpWithProvider(LoginProvider.Google)}
          >
            <GoogleLogo height={20} width={20} />
            <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
              Continue with Google
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default SignUp;
