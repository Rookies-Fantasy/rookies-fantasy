import { yupResolver } from "@hookform/resolvers/yup";
import {
  FirebaseAuthTypes,
  getAuth,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { X, Eye, EyeSlash, WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import * as yup from "yup";
import GoogleLogo from "@/assets/icons/google.svg";
import Spinner from "@/components/Spinner";
import { useAppDispatch } from "@/state/hooks";
import { CurrentUser, setUser } from "@/state/slices/userSlice";
import { signInWithGoogle } from "@/utils/socialAuth";
import { UserController } from "@/controllers/userController";

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

const LoginScreen = () => {
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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
      const userData = await UserController.getUser(user.uid);

      if (userData !== undefined) {
        if (userData?.createdAt instanceof firestore.Timestamp) {
          userData.createdAt = userData.createdAt.toDate().toISOString();
        }

        if (userData?.updatedAt instanceof firestore.Timestamp) {
          userData.updatedAt = userData.updatedAt.toDate().toISOString();
        }

        dispatch(setUser(userData as CurrentUser));
        router.push("/(protected)");
      } else {
        dispatch(
          setUser({
            email: user.email ?? undefined,
            id: user.uid,
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

      router.replace("/(auth)/createProfile");
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
        } else if (firebaseError.code === "auth/invalid-credential") {
          setError("root", {
            type: "manual",
            message: "These are invalid credentials. Please try again.",
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
            <X color="white" size={20} weight="bold" />
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
            className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full items-center justify-center rounded-md`}
            disabled={!isValid || loading}
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

export default LoginScreen;
