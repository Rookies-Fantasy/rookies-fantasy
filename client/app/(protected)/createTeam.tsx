import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import { ArrowLeft, WarningCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Image,
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  ImageSourcePropType,
  Keyboard,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import { TeamEditModel, UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
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
    url: "../../assets/images/team/1.png",
    source: require("../../assets/images/team/1.png"),
  },
  {
    url: "../../assets/images/team/2.png",
    source: require("../../assets/images/team/2.png"),
  },
  {
    url: "../../assets/images/team/3.png",
    source: require("../../assets/images/team/3.png"),
  },
  {
    url: "../../assets/images/team/4.png",
    source: require("../../assets/images/team/4.png"),
  },
  {
    url: "../../assets/images/team/5.png",
    source: require("../../assets/images/team/5.png"),
  },
  {
    url: "../../assets/images/team/6.png",
    source: require("../../assets/images/team/6.png"),
  },
  {
    url: "../../assets/images/team/7.png",
    source: require("../../assets/images/team/7.png"),
  },
  {
    url: "../../assets/images/team/8.png",
    source: require("../../assets/images/team/8.png"),
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
  const userId = useAppSelector((state) => state.user.id);
  const teamId = useAppSelector((state) => state.team.id);

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
      if (userId && teamId) {
        try {
          const teams = await UserController.getUserTeams(userId);

          // A user should only have either 0 or 1 team on the createTeam screen.
          if (teams?.length === 1) {
            const matchedLogo = logoOptions.find(
              (option) => option.url === teams[0].logoUrl,
            );
            setSelectedLogoOption(matchedLogo || logoOptions[0]);

            reset({
              abbreviation: teams[0].abbreviation,
              name: teams[0].name,
              logoUrl: teams[0].logoUrl,
            });
          }
        } catch (error) {
          console.error("Error fetching user teams:", error);
        }
      }
    };

    setDefaultTeamData();
  }, [teamId, reset, userId]);

  const handleCreateTeam = async (model: TeamEditModel) => {
    setIsLoading(true);
    try {
      const teams = await UserController.getUserTeams(userId);

      let newTeamId: string;

      if (teams?.length === 0) {
        newTeamId = await UserController.addUserTeam(userId, model);
      } else if (teams?.length === 1) {
        newTeamId = teams[0].id;
        await UserController.editUserTeam(userId, newTeamId, model);
      } else {
        throw new Error("Unexpected number of teams in create team screen");
      }

      const teamData = await UserController.getUserTeam(userId, newTeamId);
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

      router.replace("/(protected)/(tabs)");
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <KeyboardAvoidingView behavior="padding" className="flex-1">
            <View className="flex-1 flex-col px-6 py-4">
              <View className="mb-8 mt-20 flex-row items-center gap-4">
                <Pressable
                  className="size-8 items-center justify-center rounded-md border border-gray-900"
                  onPress={() => router.back()}
                >
                  <ArrowLeft color="white" size={20} weight="bold" />
                </Pressable>
                <Text className="pbk-h5 text-base-white">Create your team</Text>
              </View>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      Team Name
                    </Text>
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
                        <WarningCircle
                          color="#dc2626"
                          size={20}
                          weight="bold"
                        />
                      )}
                    </View>
                  </>
                )}
              />
              <View className="mb-4">
                {errors.name ? (
                  <Text className="pbk-b3 text-red-600">
                    {errors.name.message}
                  </Text>
                ) : (
                  <Text className="pbk-b3 text-gray-600">
                    This is your team name. You can change it later.
                  </Text>
                )}
              </View>

              <Controller
                control={control}
                name="abbreviation"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      Team Abbreviation
                    </Text>
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.abbreviation ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                    >
                      <TextInput
                        autoCapitalize="characters"
                        className="flex-1 text-base-white placeholder:pbk-b1"
                        maxLength={3}
                        onChangeText={(text) => {
                          onChange(text);
                        }}
                        placeholder="Enter team abbreviation"
                        placeholderTextColor="gray"
                        value={value}
                      />
                      {errors.abbreviation && (
                        <WarningCircle
                          color="#dc2626"
                          size={20}
                          weight="bold"
                        />
                      )}
                    </View>
                  </>
                )}
              />
              <View className="mb-4">
                {errors.abbreviation && (
                  <Text className="pbk-b3 text-red-600">
                    {errors.abbreviation.message}
                  </Text>
                )}
              </View>

              <Text className="pbk-b2 mb-1.5 text-base-white">Team logo</Text>
              <View className="mb-2 mt-4 flex-row items-center justify-between">
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowBottomDrawer(true);
                  }}
                >
                  <Image
                    className="h-24 w-24 rounded-full border-2 border-purple-600"
                    source={selectedLogoOption.source}
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowBottomDrawer(true);
                  }}
                >
                  <Text className="pbk-b2 p-4 text-purple-600">
                    Change team logo
                  </Text>
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
            <Button
              isLoading={isLoading}
              label="Finish Account Creation"
              onPress={handleSubmit(handleCreateTeam)}
            />
          </View>
        </View>
      </Pressable>

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
            <View className="mb-6 flex-1 flex-row flex-wrap justify-between px-6 py-4">
              {logoOptions.map((teamLogoOption, index) => {
                const isSelected =
                  selectedLogoOption.url === teamLogoOption.url;
                return (
                  <Pressable
                    className="relative mb-2.5 aspect-square w-[26%] items-center justify-center"
                    key={index}
                    onPress={() => {
                      onChange(teamLogoOption.url);
                      setSelectedLogoOption(teamLogoOption);
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
          )}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

export default CreateTeam;
