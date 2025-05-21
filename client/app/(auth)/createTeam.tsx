import { yupResolver } from "@hookform/resolvers/yup";
import { getAuth } from "@react-native-firebase/auth";
import { router } from "expo-router";
import { WarningCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Image,
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  ImageSourcePropType,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import * as yup from "yup";
import BackIcon from "@/assets/icons/back-icon.svg";
import BottomSheet from "@/components/BottomSheet";
import Spinner from "@/components/Spinner";
import { TeamEditModel, UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setTeam } from "@/state/slices/teamSlice";

type LogoOption = {
  url: string;
  source: ImageSourcePropType;
};

const logoOptions: LogoOption[] = [
  {
    url: "../../assets/images/placeholder-avatar.png",
    source: require("../../assets/images/placeholder-avatar.png"),
  },
  {
    url: "../../assets/images/team/team-1.png",
    source: require("../../assets/images/team/team-1.png"),
  },
  {
    url: "../../assets/images/team/team-2.png",
    source: require("../../assets/images/team/team-2.png"),
  },
  {
    url: "../../assets/images/team/team-3.png",
    source: require("../../assets/images/team/team-3.png"),
  },
  {
    url: "../../assets/images/team/team-4.png",
    source: require("../../assets/images/team/team-4.png"),
  },
  {
    url: "../../assets/images/team/team-5.png",
    source: require("../../assets/images/team/team-5.png"),
  },
  {
    url: "../../assets/images/team/team-6.png",
    source: require("../../assets/images/team/team-6.png"),
  },
  {
    url: "../../assets/images/team/team-7.png",
    source: require("../../assets/images/team/team-7.png"),
  },
  {
    url: "../../assets/images/team/team-8.png",
    source: require("../../assets/images/team/team-8.png"),
  },
];

const schema = yup.object({
  abbreviation: yup
    .string()
    .required("Team Abbreviation is required")
    .length(3, "Team Abbreviation must be exactly 3 characters"),
  name: yup.string().required("Team Name is required"),
  logoUrl: yup
    .string()
    .required("Logo is required")
    .test(
      "not-default-logo",
      "Logo is required",
      (value) => value !== logoOptions[0].url,
    ),
});

const CreateTeam = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogoOption, setSelectedLogoOption] = useState<LogoOption>(
    logoOptions[0],
  );
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<TeamEditModel>({
    resolver: yupResolver(schema),
    defaultValues: {
      abbreviation: "",
      name: "",
      logoUrl: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    const setDefaultTeamData = async () => {
      if (currentUser) {
        const teams = await UserController.getUserTeams(currentUser.uid);

        // A user should only have either 0 or 1 team on the createTeam screen.
        if (teams?.length === 1) {
          const matchedLogo = logoOptions.find(
            (option) => option.url === teams[0]!.logoUrl,
          );
          if (matchedLogo) {
            setSelectedLogoOption(matchedLogo);
          }

          reset({
            abbreviation: teams[0].abbreviation,
            name: teams[0].name,
            logoUrl: teams[0].logoUrl,
          });
        }
      }
    };

    setDefaultTeamData();
  }, [currentUser, reset]);

  const handleCreateTeam = async (model: TeamEditModel) => {
    setIsLoading(true);
    try {
      if (!currentUser) {
        router.push("/(auth)");
        return;
      }

      const userId = currentUser.uid;
      const teams = await UserController.getUserTeams(userId);

      let teamId: string;

      if (teams?.length === 0) {
        teamId = await UserController.addUserTeam(userId, model);
      } else if (teams?.length === 1) {
        teamId = teams[0].id;
        await UserController.editUserTeam(userId, teamId, model);
      } else {
        throw new Error("Unexpected number of teams in create team screen");
      }

      const teamData = await UserController.getUserTeam(userId, teamId);
      if (teamData) {
        dispatch(
          setTeam({
            id: teamData.id,
            name: teamData.name,
            abbreviation: teamData.abbreviation,
            logoUrl: teamData.logoUrl,
          }),
        );
      }

      router.replace("/(protected)");
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-950">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <KeyboardAvoidingView behavior="padding" className="flex-1">
            <View className="flex-1 flex-col px-6 py-4">
              <View className="my-8 size-8 self-end" />

              <View className="flex-row items-start">
                <Pressable
                  className="mr-3"
                  onPress={() => router.push("/(auth)/createProfile")}
                >
                  <BackIcon fill="white" height={25} width={25} />
                </Pressable>
                <Text className="pbk-h5 mb-8 text-base-white">
                  Create your team
                </Text>
              </View>

              <Text className="pbk-b2 mb-1.5 text-base-white">Team Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View
                    className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.name ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                  >
                    <TextInput
                      autoCapitalize="none"
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      onChangeText={(text) => {
                        onChange(text);
                      }}
                      placeholder="Enter team name"
                      placeholderTextColor="gray"
                      value={value}
                    />
                    {errors.name && (
                      <WarningCircle color="#dc2626" size={20} weight="bold" />
                    )}
                  </View>
                )}
              />
              {errors.name && (
                <Text className="pbk-b3 mb-2 text-red-600">
                  {errors.name.message}
                </Text>
              )}
              <View className="mb-5">
                <Text className="pbk-b3 text-gray-600">
                  This is your team name. You can change it later.
                </Text>
              </View>

              <Text className="pbk-b2 mb-1.5 text-base-white">
                Team Abbreviation
              </Text>
              <Controller
                control={control}
                name="abbreviation"
                render={({ field: { onChange, value } }) => (
                  <View
                    className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.name ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                  >
                    <TextInput
                      autoCapitalize="characters"
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      onChangeText={(text) => {
                        onChange(text);
                      }}
                      placeholder="Enter team abbreviation"
                      placeholderTextColor="gray"
                      value={value}
                    />
                    {errors.abbreviation && (
                      <WarningCircle color="#dc2626" size={20} weight="bold" />
                    )}
                  </View>
                )}
              />
              {errors.abbreviation && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.abbreviation.message}
                </Text>
              )}

              <Text className="pbk-b2 mb-1.5 text-base-white">Team logo</Text>
              <View className="mb-2 mt-4 flex-row items-center justify-between">
                <Pressable onPress={() => setShowBottomDrawer(true)}>
                  <Image
                    className="h-24 w-24 rounded-full border-2 border-purple-600"
                    source={selectedLogoOption.source}
                  />
                </Pressable>
                <Pressable onPress={() => setShowBottomDrawer(true)}>
                  <Text className="text-purple-600">Change Team Logo</Text>
                </Pressable>
              </View>
              {errors.logoUrl && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.logoUrl.message}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>

          <View className="mb-8 justify-end bg-gray-950 px-6">
            <Pressable
              className="min-h-12 w-full items-center justify-center rounded-md bg-purple-600"
              disabled={isLoading}
              onPress={handleSubmit(handleCreateTeam)}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <Text className="pbk-h7 text-center text-base-white">
                  FINISH ACCOUNT CREATION
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <BottomSheet
        footer={
          <Pressable
            className="min-h-12 w-full justify-center rounded-md bg-purple-600"
            onPress={() => setShowBottomDrawer(false)}
          >
            <Text className="pbk-h7 text-center text-base-white">SAVE</Text>
          </Pressable>
        }
        header={
          <Text className="pbk-b1 text-center text-base-white">
            Change team logo
          </Text>
        }
        isOpen={showBottomDrawer}
        onClose={() => setShowBottomDrawer(false)}
        snapPoints={["66%"]}
      >
        <Controller
          control={control}
          name="logoUrl"
          render={({ field: { onChange } }) => (
            <View className="flex-1 px-6 py-4">
              <View className="mb-6 flex-row flex-wrap justify-between">
                {logoOptions.map((teamLogoOption, index) => {
                  const isSelected =
                    selectedLogoOption.url === teamLogoOption.url;
                  return (
                    <Pressable
                      className="relative mb-2.5 aspect-square w-[26%] items-center justify-center"
                      key={index}
                      onPress={() => {
                        setSelectedLogoOption(teamLogoOption);
                        setValue("logoUrl", teamLogoOption.url);
                      }}
                    >
                      {isSelected && (
                        <View className="absolute -bottom-1 -left-1 -right-1 -top-1 rounded-full border-4 border-purple-600" />
                      )}

                      <Image
                        className="h-full w-full rounded-full"
                        resizeMode="cover"
                        source={teamLogoOption.source}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        />
      </BottomSheet>
    </View>
  );
};

export default CreateTeam;
