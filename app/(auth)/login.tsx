import { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { X, Eye, EyeSlash, WarningCircle } from "phosphor-react-native";
import GoogleLogo from "@/assets/icons/google.svg";
import AppleLogo from "@/assets/icons/apple.svg";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  FirebaseAuthTypes,
  getAuth,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as WebBrowser from "expo-web-browser";
import { signInWithGoogle } from "@/utils/socialAuth";
import { useAppDispatch } from "@/state/hooks";
import { CurrentUser, setUser } from "@/state/slices/userSlice";
import Spinner from "@/components/Spinner";

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

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const logInWithProvider = async (provider: string) => {
    try {
      if (provider === "google") {
        const { user } = await signInWithGoogle();
        await handleAuthenticatedUser(user);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAuthenticatedUser = async (user: FirebaseAuthTypes.User) => {
    try {
      const userDoc = await firestore().collection("users").doc(user.uid).get();
      console.log("Auth listener:" + userDoc);

      if (userDoc.exists) {
        const userData = userDoc.data();

        if (userData?.createdAt instanceof firestore.Timestamp) {
          userData.createdAt = userData.createdAt.toDate().toISOString();
        }

        if (userData?.updatedAt instanceof firestore.Timestamp) {
          userData.updatedAt = userData.updatedAt.toDate().toISOString();
        }

        dispatch(setUser(userData as CurrentUser));
        router.push("/(app)/(tabs)");
      } else {
        dispatch(
          setUser({
            userId: user.uid,
            email: user.email ?? undefined,
            isLoading: false,
          }),
        );
        router.push("/(auth)/createProfile");
      }
    } catch (error) {
      console.log("Failed to handle user after auth", error);
    }
  };

  const handleLogin = async (data: FormData) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error) {
      console.log(error);
      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === "auth/invalid-email") {
          setError("email", {
            type: "manual",
            message:
              "The email or password you entered is incorrect. Please try again.",
          });
        } else if (firebaseError.code === "auth/wrong-password") {
          setError("password", {
            type: "manual",
            message: "Incorrect password.",
          });
        }
      } else {
        setError("root", {
          type: "manual",
          message: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
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
            <X size={20} color="white" weight="bold" />
          </Pressable>

          <Text className="pbk-h5 mb-8 text-base-white">Login</Text>
          <Text className="pbk-b2 mb-1.5 text-base-white">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View
                className={`mb-1 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${errors.email ? "border-red-600" : "border-gray-920"} px-2 py-2`}
              >
                <TextInput
                  placeholder="Enter email"
                  value={value}
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                  textAlignVertical="center"
                  className="flex-1 text-base-white placeholder:pbk-b1"
                  placeholderTextColor="gray"
                />
                {errors.email && (
                  <WarningCircle size={20} color="red" weight="bold" />
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
                className={`mb-1 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.password ? "border-red-600" : "border-gray-920"} px-3 py-2`}
              >
                <TextInput
                  placeholder="Enter password"
                  className="flex-1 text-base-white placeholder:pbk-b1"
                  placeholderTextColor="gray"
                  secureTextEntry={hidePassword}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                />
                <Pressable
                  className="flex-row gap-2"
                  onPress={() => setHidePassword(!hidePassword)}
                >
                  {hidePassword ? (
                    <EyeSlash size={20} color="gray" weight="bold" />
                  ) : (
                    <Eye size={20} color="gray" weight="bold" />
                  )}
                  {errors.password && (
                    <WarningCircle size={20} color="red" weight="bold" />
                  )}
                </Pressable>
              </View>
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
            disabled={!isValid || loading}
            className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full justify-center rounded-md`}
            onPress={handleSubmit(handleLogin)}
          >
            {loading ? (
              <Spinner />
            ) : (
              <Text
                className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
              >
                LOGIN
              </Text>
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

          <Pressable
            className="mb-4 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920"
            onPress={() => logInWithProvider("google")}
          >
            <GoogleLogo width={20} height={20} />
            <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
              Continue with Google
            </Text>
          </Pressable>

          <Pressable
            className="min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920"
            onPress={() => router.push("/(auth)/signUp")}
          >
            <AppleLogo width={20} height={20} />
            <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
              Continue with Apple
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
