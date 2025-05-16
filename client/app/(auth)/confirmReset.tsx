import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  View,
  Text,
  Pressable,
} from "react-native";
import MailIcon from "@/assets/icons/mail.svg";
import { PressableLink } from "@/components/PressableLink";
import Spinner from "@/components/Spinner";
import { cn } from "@/utils/cn";

const ConfirmReset = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const auth = getAuth();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setCooldown(60);
    } catch (error) {
      const firebaseError = error as { code: string };

      console.error("Resend error:", error);
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
            <MailIcon height={180} width={180} />
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
            {cooldown > 0 && (
              <Text className="pbk-b2 text-center text-base-white">
                Resend email again in {cooldown} seconds.
              </Text>
            )}
            <PressableLink
              className="my-4 min-h-12 w-full items-center justify-center rounded-md bg-purple-600"
              href="/(auth)/login"
              label="RETURN TO LOGIN"
            />
            <Pressable
              className="min-h-12 w-full items-center justify-center bg-gray-950"
              disabled={cooldown > 0 || isLoading}
              onPress={handleResendEmail}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <Text
                  className={cn(
                    "pbk-h7 text-center",
                    cooldown > 0 ? "text-gray-400" : "text-base-white",
                  )}
                >
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
