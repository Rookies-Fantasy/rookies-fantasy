import { yupResolver } from "@hookform/resolvers/yup";
import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { router } from "expo-router";
import { ArrowLeft, WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";
import Spinner from "@/components/Spinner";

const schema = yup.object({
  emailOrUsername: yup.string().required("Email or username is required"),
});

type ForgotPasswordFormData = {
  emailOrUsername: string;
};

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      emailOrUsername: "",
    },
  });

  const findEmail = async (data: string): Promise<string> => {
    const userSnapshot = await firestore()
      .collection("users")
      .where("username", "==", data)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData.email;
    }

    return data;
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const identifier = data.emailOrUsername.trim();

      const emailToUse = await findEmail(identifier);

      await sendPasswordResetEmail(auth, emailToUse);

      router.push({
        pathname: "/(auth)/confirmReset",
        params: { email: emailToUse },
      });
    } catch (error) {
      const firebaseError = error as { code: string };

      console.error("Forgot password error:", error);
      if (firebaseError.code === "auth/invalid-email") {
        setError("emailOrUsername", {
          message: "Please enter a valid email address.",
        });
      } else if (firebaseError.code === "auth/user-not-found") {
        setError("emailOrUsername", {
          message: "No user found with this email address.",
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
            <Pressable
              className="size-8 items-center justify-center rounded-md border border-gray-900 p-4"
              onPress={() => router.dismissAll()}
            >
              <ArrowLeft color="white" size={20} weight="bold" />
            </Pressable>
            <Text className="pbk-h5 text-base-white">Forgot password?</Text>
          </View>

          <Text className="pbk-b1 mb-8 text-base-white">
            Enter your email address or username and we will send you a link to
            reset your password.
          </Text>

          <Controller
            control={control}
            name="emailOrUsername"
            render={({ field: { onChange, value } }) => (
              <>
                <Text className="pbk-b2 mb-1.5 text-base-white">
                  Email or username
                </Text>

                <View
                  className={`mb-1 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${errors.emailOrUsername ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                >
                  <TextInput
                    autoCapitalize="none"
                    className="flex-1 text-base-white placeholder:pbk-b1"
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    placeholder="Enter email or username"
                    placeholderTextColor="gray"
                    value={value}
                  />
                  {errors.emailOrUsername && (
                    <WarningCircle color="red" size={20} weight="bold" />
                  )}
                </View>
              </>
            )}
          />

          <View className="mb-5">
            {errors.emailOrUsername && (
              <Text className="pbk-b3 mb-4 text-red-600">
                {errors.emailOrUsername.message}
              </Text>
            )}
          </View>

          <Pressable
            className={`${!isValid ? "bg-purple-900" : "bg-purple-600"} min-h-12 w-full items-center justify-center rounded-md`}
            disabled={!isValid || isLoading}
            onPress={handleSubmit(onSubmit)}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <Text
                className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
              >
                RESET PASSWORD
              </Text>
            )}
          </Pressable>

          <Text
            className="pbk-b1 mt-5 text-center text-purple-600"
            onPress={() => router.back()}
          >
            Or sign in
          </Text>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default ForgotPassword;
