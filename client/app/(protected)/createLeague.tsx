import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import { ArrowLeft, WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Image,
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Keyboard,
  Pressable,
  Alert,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import {
  LeagueController,
  LeagueEditModel,
} from "@/controllers/leagueController";
import { TeamEditModel, UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setCurrentLeague } from "@/state/slices/leagueSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { Asset, defaultTeamLogo, teamLogoOptions } from "@/types/asset";

const leagueDetailsSchema = yup.object({
  name: yup
    .string()
    .required("League name is required")
    .max(50, "League name must be at most 50 characters"),
  numberOfTeams: yup
    .number()
    .required("Number of teams is required")
    .min(4, "Minimum teams must be at least 4")
    .max(20, "Maximum teams is 20")
    .typeError("Must be a number"),
  budget: yup
    .number()
    .required("Budget is required")
    .min(150000000, "Budget must be at least $150,000,000")
    .max(250000000, "Budget must be no more than $250,000,000")
    .typeError("Must be a number"),
});

const teamDetailsSchema = yup.object({
  name: yup
    .string()
    .required("Team name is required")
    .max(30, "Team name must be at most 30 characters"),
  abbreviation: yup
    .string()
    .required("Team abbreviation is required")
    .length(3, "Team Abbreviation must be exactly 3 characters"),
  logoUrl: yup
    .string()
    .required("Logo is required")
    .test(
      "not-default-logo",
      "Logo is required",
      (value) => value !== defaultTeamLogo.url,
    ),
});

const CreateLeague = () => {
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogoOption, setSelectedLogoOption] =
    useState<Asset>(defaultTeamLogo);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);

  const {
    control: leagueControl,
    handleSubmit: handleLeagueSubmit,
    getValues: getLeagueValues,
    formState: { errors: leagueErrors },
  } = useForm<LeagueEditModel>({
    resolver: yupResolver(leagueDetailsSchema),
    defaultValues: {
      name: "",
      numberOfTeams: 4,
      budget: 150000000,
    },
    mode: "onSubmit",
  });

  const {
    control: teamControl,
    handleSubmit: handleTeamSubmit,
    formState: { errors: teamErrors },
  } = useForm<TeamEditModel>({
    resolver: yupResolver(teamDetailsSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      logoUrl: "",
      isLeagueTeam: true,
    },
    mode: "onSubmit",
  });

  const handleCreateLeague = async (teamModel: TeamEditModel) => {
    const leagueModel = getLeagueValues();

    Alert.alert(
      "Confirm League Creation",
      `League Name: ${leagueModel.name}\nNumber of Teams: ${leagueModel.numberOfTeams}\nBudget: $${(leagueModel.budget / 1000000).toFixed(0)}M\n
       \nYour Team: ${teamModel.name} (${teamModel.abbreviation})\n\nAre you sure you want to create this league?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Create",
          style: "default",
          onPress: async () => {
            setIsLoading(true);
            try {
              const teamId = await UserController.addUserTeam(
                userId,
                teamModel,
              );

              const teamData = await UserController.getUserTeam(userId, teamId);
              if (teamData) {
                dispatch(
                  setTeam({
                    abbreviation: teamData.abbreviation,
                    balance: teamData.balance,
                    bench: teamData.bench,
                    id: teamData.id,
                    isLeagueTeam: teamData.isLeagueTeam,
                    lineup: teamData.lineup,
                    logoUrl: teamData.logoUrl,
                    name: teamData.name,
                  }),
                );
              }

              const league = await LeagueController.createLeague(userId, {
                ...leagueModel,
                initalTeamId: teamId,
              });

              dispatch(setCurrentLeague(league));

              router.back();
            } catch (error) {
              console.error("Failed to create league: ", error);
              Alert.alert(
                "Error",
                "Failed to create league. Please try again.",
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View className="flex-1">
        <KeyboardAvoidingView
          behavior="padding"
          className="mt-8 flex-1 flex-col px-6"
        >
          {currentStep === 1 ? (
            /* Step 1: League Details */
            <ScrollView contentContainerClassName="flex-1 px-6 pt-8">
              <View className="mb-8 flex-row items-center gap-4">
                <Pressable
                  className="size-8 items-center justify-center rounded-md border border-gray-900"
                  onPress={() => router.back()}
                >
                  <ArrowLeft color="white" size={20} weight="bold" />
                </Pressable>
                <Text className="pbk-h5 text-base-white">
                  Create League - Step 1 of 2
                </Text>
              </View>

              <Controller
                control={leagueControl}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      League Name
                    </Text>
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${leagueErrors.name ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                    >
                      <TextInput
                        autoCapitalize="words"
                        className="flex-1 text-base-white placeholder:pbk-b1"
                        maxLength={50}
                        onChangeText={onChange}
                        placeholder="Enter league name"
                        placeholderTextColor="gray"
                        value={value}
                      />
                      {leagueErrors.name && (
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
                {leagueErrors.name ? (
                  <Text className="pbk-b3 text-red-600">
                    {leagueErrors.name.message}
                  </Text>
                ) : (
                  <Text className="pbk-b3 text-gray-600">
                    Choose a name of your league
                  </Text>
                )}
              </View>

              <Controller
                control={leagueControl}
                name="numberOfTeams"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      Number of Teams
                    </Text>
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${leagueErrors.numberOfTeams ? "border-red-600" : "border-gray-920"} px-4 py-2`}
                    >
                      <Pressable
                        className={`h-10 w-10 items-center justify-center rounded-lg ${value <= 4 ? "bg-gray-800" : "bg-red-600"}`}
                        disabled={value <= 4}
                        onPress={() => {
                          const newValue = Math.max(4, value - 2);
                          onChange(newValue);
                        }}
                      >
                        <Text
                          className={`text-xl ${value <= 4 ? "text-gray-600" : "text-base-white"}`}
                        >
                          −
                        </Text>
                      </Pressable>

                      <Text className="pbk-h6 text-base-white">{value}</Text>

                      <Pressable
                        className={`h-10 w-10 items-center justify-center rounded-lg ${value >= 20 ? "bg-gray-800" : "bg-green-600"}`}
                        disabled={value >= 20}
                        onPress={() => {
                          const newValue = Math.min(20, value + 2);
                          onChange(newValue);
                        }}
                      >
                        <Text
                          className={`text-xl ${value >= 20 ? "text-gray-600" : "text-base-white"}`}
                        >
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              />
              <View className="mb-4">
                {leagueErrors.numberOfTeams ? (
                  <Text className="pbk-b3 text-red-600">
                    {leagueErrors.numberOfTeams.message}
                  </Text>
                ) : (
                  <Text className="pbk-b3 text-gray-600">
                    Minimum teams required to start the league
                  </Text>
                )}
              </View>

              <Controller
                control={leagueControl}
                name="budget"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      Team Budget
                    </Text>
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${leagueErrors.budget ? "border-red-600" : "border-gray-920"} px-4 py-2`}
                    >
                      <Pressable
                        className={`h-10 w-10 items-center justify-center rounded-lg ${value <= 150000000 ? "bg-gray-800" : "bg-red-600"}`}
                        disabled={value <= 150000000}
                        onPress={() => {
                          const newValue = Math.max(
                            150000000,
                            value - 25000000,
                          );
                          onChange(newValue);
                        }}
                      >
                        <Text
                          className={`text-xl ${value <= 150000000 ? "text-gray-600" : "text-base-white"}`}
                        >
                          −
                        </Text>
                      </Pressable>

                      <Text className="pbk-h6 text-base-white">
                        ${(value / 1000000).toFixed(0)}M
                      </Text>

                      <Pressable
                        className={`h-10 w-10 items-center justify-center rounded-lg ${value >= 250000000 ? "bg-gray-800" : "bg-green-600"}`}
                        disabled={value >= 250000000}
                        onPress={() => {
                          const newValue = Math.min(
                            250000000,
                            value + 25000000,
                          );
                          onChange(newValue);
                        }}
                      >
                        <Text
                          className={`text-xl ${value >= 250000000 ? "text-gray-600" : "text-base-white"}`}
                        >
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              />
              <View className="mb-6">
                {leagueErrors.budget ? (
                  <Text className="pbk-b3 text-red-600">
                    {leagueErrors.budget.message}
                  </Text>
                ) : (
                  <Text className="pbk-b3 text-gray-600">
                    Budget range: $150M - $250M
                  </Text>
                )}
              </View>
            </ScrollView>
          ) : (
            /* Step 2: Team Details */
            <View className="flex-1 flex-col">
              <View className="mb-8 flex-row items-center gap-4">
                <Pressable
                  className="size-8 items-center justify-center rounded-md border border-gray-900"
                  onPress={() => setCurrentStep(1)}
                >
                  <ArrowLeft color="white" size={20} weight="bold" />
                </Pressable>
                <Text className="pbk-h5 text-base-white">
                  Create League - Step 2 of 2
                </Text>
              </View>

              <Controller
                control={teamControl}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      Team Name
                    </Text>
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${teamErrors.name ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                    >
                      <TextInput
                        autoCapitalize="none"
                        className="flex-1 text-base-white placeholder:pbk-b1"
                        onChangeText={onChange}
                        placeholder="Enter team name"
                        placeholderTextColor="gray"
                        value={value}
                      />
                      {teamErrors.name && (
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
                {teamErrors.name ? (
                  <Text className="pbk-b3 text-red-600">
                    {teamErrors.name.message}
                  </Text>
                ) : (
                  <Text className="pbk-b3 text-gray-600">
                    This is your team name. You can change it later.
                  </Text>
                )}
              </View>

              <Controller
                control={teamControl}
                name="abbreviation"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text className="pbk-b2 mb-1.5 text-base-white">
                      Team Abbreviation
                    </Text>
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${teamErrors.abbreviation ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                    >
                      <TextInput
                        autoCapitalize="characters"
                        className="flex-1 text-base-white placeholder:pbk-b1"
                        maxLength={3}
                        onChangeText={onChange}
                        placeholder="Enter team abbreviation"
                        placeholderTextColor="gray"
                        value={value}
                      />
                      {teamErrors.abbreviation && (
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
                {teamErrors.abbreviation && (
                  <Text className="pbk-b3 text-red-600">
                    {teamErrors.abbreviation.message}
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
              {teamErrors.logoUrl && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {teamErrors.logoUrl.message}
                </Text>
              )}
            </View>
          )}
        </KeyboardAvoidingView>

        <View className="justify-end bg-gray-950 px-6">
          {currentStep === 1 ? (
            <Button
              label="Next"
              onPress={handleLeagueSubmit(() => setCurrentStep(2))}
            />
          ) : (
            <Button
              isLoading={isLoading}
              label="Create League"
              onPress={handleTeamSubmit(handleCreateLeague)}
            />
          )}
        </View>
      </View>

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
          control={teamControl}
          name="logoUrl"
          render={({ field: { onChange } }) => (
            <View className="mb-6 flex-1 flex-row flex-wrap justify-between px-6 py-4">
              {teamLogoOptions.map((teamLogoOption, index) => {
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
    </Screen>
  );
};

export default CreateLeague;
