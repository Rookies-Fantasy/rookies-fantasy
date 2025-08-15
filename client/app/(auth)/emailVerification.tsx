import { getAuth, sendEmailVerification } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import { Spinner } from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Alert,
  Text,
} from "react-native";
import MailIcon from "@/assets/icons/mail.svg";
import Screen from "@/components/Screen";
import { UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setUser } from "@/state/slices/userSlice";
import { cn } from "@/utils/jsUtils";

const EmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const auth = getAuth();
  const firestore = getFirestore();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  /**
   * TODO: Remove polling and introduce cloud func and an onSnapshot listener
   * to handle verification check
   */
  useEffect(() => {
    const intervalId = setInterval(async () => {
      await auth.currentUser?.reload();

      if (!auth.currentUser?.email) {
        throw new Error("Verified user has no email");
      }

      if (auth.currentUser?.emailVerified) {
        await UserController.editUser(auth.currentUser.uid, {
          emailVerified: auth.currentUser.emailVerified,
        });

        clearInterval(intervalId);

        dispatch(
          setUser({
            id: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified,
          }),
        );

        setIsLoading(false);
        router.replace("/(protected)/createProfile");
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [auth.currentUser, dispatch, firestore, router]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Verification email sent!");
      }

      setCooldown(60);
    } catch (error) {
      console.error("Resend error:", error);
      setErrorMessage("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior="padding"
        className="my-16 flex-1 flex-col px-6 py-4"
      >
        <View className="mt-16 items-center">
          <MailIcon height={180} width={180} />
          <Text className="pbk-h5 mb-8 text-center text-base-white">
            Verification email sent!
          </Text>
          <Text className="pbk-b1 mb-8 text-center text-base-white">
            We sent a verification link to {auth.currentUser?.email}. Please
            verify this email to move to the next step.
          </Text>
        </View>

        <View className="flex w-full flex-1 justify-end gap-4">
          {cooldown > 0 && (
            <Text className="pbk-b2 p-3 text-center text-base-white">
              Resend email again in {cooldown} seconds.
            </Text>
          )}
          {errorMessage && (
            <Text className="pbk-1 p-3 text-center text-red-600">
              {errorMessage}
            </Text>
          )}
          <Pressable
            className="rounded-md bg-purple-600 p-3"
            onPress={async () => {
              router.dismissAll();
              await auth.signOut();
            }}
          >
            <Text className="pbk-h7 text-center uppercase text-base-white">
              RETURN TO ONBOARDING
            </Text>
          </Pressable>
          <Pressable
            className="p-3"
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
                RESEND VERIFICATION EMAIL
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default EmailVerification;
