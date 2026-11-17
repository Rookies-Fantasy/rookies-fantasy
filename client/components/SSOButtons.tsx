import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { AppleLogo } from "phosphor-react-native";
import { Alert, Platform, Pressable, View, Text } from "react-native";
import GoogleLogo from "@/assets/icons/google.svg";
import { UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setTeam } from "@/state/slices/teamSlice";
import { setUser } from "@/state/slices/userSlice";
import { LoginProvider } from "@/types/providers";
import {
  isAppleSignInSupported,
  signInWithApple,
  signInWithGoogle,
} from "@/utils/authUtils";
import { isNotNil } from "@/utils/jsUtils";

type ProviderConfig = {
  id: LoginProvider;
  label: string;
  icon: React.ReactNode;
};

const APPLE_PROVIDER: ProviderConfig = {
  id: LoginProvider.Apple,
  label: "Continue with Apple",
  icon: <AppleLogo color="white" size={20} weight="fill" />,
};

const GOOGLE_PROVIDER: ProviderConfig = {
  id: LoginProvider.Google,
  label: "Continue with Google",
  icon: <GoogleLogo height={20} width={20} />,
};

const PROVIDERS: ProviderConfig[] =
  Platform.OS === "ios" && isAppleSignInSupported
    ? [APPLE_PROVIDER, GOOGLE_PROVIDER]
    : [GOOGLE_PROVIDER];

const signInWithProvider = async (
  provider: LoginProvider,
): Promise<FirebaseAuthTypes.UserCredential | null> => {
  if (provider === LoginProvider.Apple) {
    return signInWithApple();
  }
  return signInWithGoogle();
};

const SSOButtons = () => {
  const dispatch = useAppDispatch();

  const handleSSOAuthentication = async (provider: LoginProvider) => {
    try {
      const credential = await signInWithProvider(provider);

      // User dismissed the sign-in sheet
      if (!credential) {
        return;
      }

      const { user } = credential;

      if (!isNotNil(user.email)) {
        throw new Error("Verified user has no email");
      }

      const userData = await UserController.getUser(user.uid);
      dispatch(setUser(userData));

      const teams = await UserController.getUserTeams(user.uid);
      if (teams?.length > 0) {
        const firstTeamId = teams[0].id;
        const teamData = await UserController.getUserTeam(
          user.uid,
          firstTeamId,
        );
        dispatch(setTeam(teamData));
      }
    } catch (error) {
      console.log(error);
      if (provider === LoginProvider.Apple) {
        Alert.alert(
          "Sign in failed",
          "We couldn't sign you in with Apple. Please try again.",
        );
      }
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
