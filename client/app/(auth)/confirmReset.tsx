import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  View,
  Text,
  Pressable,
} from "react-native";
import MailIcon from "@/assets/icons/mail.svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Spinner } from "phosphor-react-native";

const ConfirmReset = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const auth = getAuth();

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

  const handleResendEmail = async () => {
    setIsLoading(true);

    try {
      const emailToUse = await findEmail(email);

      await sendPasswordResetEmail(auth, emailToUse);

      router.push("/(auth)/confirmReset");
    } catch (error) {
      const firebaseError = error as { code: string };

      console.error("Login error:", error);
      if (firebaseError.code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else if (firebaseError.code === "auth/user-not-found") {
        setErrorMessage("No user found with this email address.");
      } else {
        setErrorMessage("Something went wrong.");
      }
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
          <View className="items-center">
            <MailIcon width={180} height={180} />
            <Text className="pbk-h5 mb-8 text-center text-base-white">
              Reset password email sent!
            </Text>
            <Text className="pbk-b1 mb-8 text-center text-base-white">
              We sent a password reset link to {email}. Please reset your
              password within 24 hours.
            </Text>
            {errorMessage && (
              <Text className="pbk-1 text-center text-red-600">
                {errorMessage}
              </Text>
            )}
          </View>

          <View className="flex-1 justify-end">
            <Pressable
              className="min-h-14 w-full items-center justify-center rounded-md bg-purple-600"
              onPress={() => router.replace("/(auth)")}
            >
              <Text className={"pbk-h6 text-center text-base-white"}>
                RETURN TO LOGIN
              </Text>
            </Pressable>
            <Pressable
              className="my-8 min-h-14 w-full items-center justify-center rounded-md bg-gray-950"
              onPress={() => handleResendEmail()}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <Text className={"pbk-h6 text-center text-base-white"}>
                  RESEND EMAIL
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default ConfirmReset;
