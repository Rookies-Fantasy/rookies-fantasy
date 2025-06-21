import React from "react";
import { Pressable, View, Text } from "react-native";
import GoogleLogo from "@/assets/icons/google.svg";
import { UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setTeam } from "@/state/slices/teamSlice";
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
  const dispatch = useAppDispatch();

  const handleSSOAuthentication = async (provider: LoginProvider) => {
    try {
      if (provider === LoginProvider.Google) {
        const { user } = await signInWithGoogle();

        if (!isNotNil(user.email)) {
          throw new Error("Verified user has no email");
        }

        const userData = await UserController.getUser(user.uid);
        dispatch(setUser(userData));

        const teams = await UserController.getUserTeams(user.uid);
        if (teams?.length > 0) {
          let firstTeamId: string;
          firstTeamId = teams[0].id;
          const teamData = await UserController.getUserTeam(
            user.uid,
            firstTeamId,
          );
          dispatch(setTeam(teamData));
        }
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
