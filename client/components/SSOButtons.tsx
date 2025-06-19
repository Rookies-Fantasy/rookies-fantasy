import { getFirestore } from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View, Text } from "react-native";
import GoogleLogo from "@/assets/icons/google.svg";
import { useAppDispatch } from "@/state/hooks";
import { setUser } from "@/state/slices/userSlice";
import { LoginProvider } from "@/types/providers";
import { signInWithGoogle } from "@/utils/authUtils";
import { isNotNil } from "@/utils/jsUtils";

type ProviderConfig = {
  id: LoginProvider;
  label: string;
  icon: React.ReactNode;
};

const PROVIDERS: ProviderConfig[] = [
  {
    id: LoginProvider.Google,
    label: "Continue with Google",
    icon: <GoogleLogo height={20} width={20} />,
  },
  // TODO: Add other providers such as Apple
];

const SSOButtons = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const firestore = getFirestore();

  const handleSSOAuthentication = async (provider: LoginProvider) => {
    try {
      if (provider === LoginProvider.Google) {
        const { user } = await signInWithGoogle();
        const userDoc = await firestore.collection("users").doc(user.uid).get();

        const userData = userDoc.data();

        if (!isNotNil(user.email)) {
          throw new Error("Verified user has no email");
        }

        if (userDoc.exists()) {
          const mappedUser = {
            id: user.uid,
            email: user.email,
            username: userData?.username,
            avatar: userData?.avatarUrl,
            dateOfBirth: userData?.dateOfBirth.toDate().toISOString(),
            emailVerified: userData?.emailVerified,
          };

          dispatch(setUser(mappedUser));
        } else {
          dispatch(
            setUser({
              id: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
            }),
          );
        }
        router.replace("/(protected)/createProfile");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View>
      {PROVIDERS.map((provider) => (
        <Pressable
          className="mb-4 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-920"
          key={provider.id}
          onPress={() => handleSSOAuthentication(provider.id)}
        >
          {provider.icon}
          <Text className="pbk-b1 rounded-lg text-center font-semibold text-base-white">
            {provider.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default SSOButtons;
