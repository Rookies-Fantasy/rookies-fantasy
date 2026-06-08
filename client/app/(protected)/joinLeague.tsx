import { yupResolver } from "@hookform/resolvers/yup";
import { useLocalSearchParams, router } from "expo-router";
import { WarningCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  View,
  Text,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  Keyboard,
  Image,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import { PressableLink } from "@/components/PressableLink";
import Screen from "@/components/Screen";
import { LeagueController } from "@/controllers/leagueController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectCurrentLeague,
  setCurrentLeague,
} from "@/state/slices/leagueSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { Asset, defaultTeamLogo, teamLogoOptions } from "@/types/asset";

const joinLeagueSchema = yup.object({
  teamName: yup.string().required("Team Name is required"),
  abbreviation: yup
    .string()
    .required("Team Abbreviation is required")
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

type JoinLeagueFormData = yup.InferType<typeof joinLeagueSchema>;

const SWIPE_THRESHOLD = 50;

const JoinLeague = () => {
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();
  const { width: screenWidth } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogoOption, setSelectedLogoOption] =
    useState<Asset>(defaultTeamLogo);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);

  const { leagueId } = useLocalSearchParams<{ leagueId?: string }>();
  const currentLeague = useAppSelector(selectCurrentLeague);

  useEffect(() => {
    if (!leagueId) return;

    const fetchLeague = async () => {
      try {
        const league = await LeagueController.getLeague(leagueId);

        if (!league) {
          Alert.alert("Error", "League not found.");
          return;
        }

        dispatch(setCurrentLeague(league));
      } catch (error) {
        console.error("Failed to fetch league:", error);
        Alert.alert("Error", "Failed to load league.");
      }
    };

    fetchLeague();
  }, [dispatch, leagueId]);

  // Animation value for sliding
  const gestureTranslateX = useSharedValue(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinLeagueFormData>({
    resolver: yupResolver(joinLeagueSchema),
    defaultValues: {
      teamName: "",
      abbreviation: "",
      logoUrl: "",
    },
    mode: "onSubmit",
  });

  const goToStep1 = () => {
    setCurrentStep(1);
  };

  const goToStep2 = () => {
    setCurrentStep(2);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const baseX = currentStep === 1 ? 0 : -screenWidth;
      let newX = baseX + event.translationX;

      if (newX > 0) newX = 0;
      if (newX < -screenWidth) newX = -screenWidth;

      gestureTranslateX.value = newX;
    })
    .onEnd((event) => {
      const baseX = currentStep === 1 ? 0 : -screenWidth;
      const dragDistance = event.translationX;

      if (currentStep === 1 && dragDistance < -SWIPE_THRESHOLD) {
        gestureTranslateX.value = withTiming(-screenWidth, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(goToStep2)();
      } else if (currentStep === 2 && dragDistance > SWIPE_THRESHOLD) {
        gestureTranslateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(goToStep1)();
      } else {
        gestureTranslateX.value = withTiming(baseX, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const step1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: gestureTranslateX.value }],
  }));

  const step2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: gestureTranslateX.value + screenWidth }],
  }));

  const handleNext = async () => {
    gestureTranslateX.value = withTiming(-screenWidth, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    setCurrentStep(2);
  };

  const handleJoinLeague = async (data: JoinLeagueFormData) => {
    if (!leagueId || !currentLeague) {
      Alert.alert("No league found", "Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const teamId = await UserController.addUserTeam(userId, {
        name: data.teamName,
        abbreviation: data.abbreviation,
        logoUrl: data.logoUrl,
        isLeagueTeam: true,
        balance: currentLeague.budget,
      });

      const teamData = await UserController.getUserTeam(userId, teamId);
      if (teamData) {
        dispatch(
          setTeam({
            id: teamData.id,
            name: teamData.name,
            abbreviation: teamData.abbreviation,
            logoUrl: teamData.logoUrl,
            lineup: teamData.lineup,
            bench: teamData.bench,
            balance: teamData.balance,
            isLeagueTeam: teamData.isLeagueTeam,
          }),
        );
      }

      await LeagueController.joinLeague(leagueId, teamId, userId);

      router.replace("/(protected)/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Failed to join league",
        `${error.message}. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!leagueId) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="pbk-h5 text-base-white">Invalid invite link</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 overflow-hidden">
        <KeyboardAvoidingView
          behavior="padding"
          className="mt-8 flex-1 flex-col px-6"
        >
          <View className="mb-8 flex-row items-center gap-4">
            <Text className="pbk-h5 text-base-white">
              {currentStep === 1 ? "Join League" : "Create Your Team"}
            </Text>
          </View>

          <View className="mb-6 flex-row justify-center gap-2">
            <View
              className={`h-2 w-8 rounded-full ${currentStep >= 1 ? "bg-purple-600" : "bg-gray-800"}`}
            />
            <View
              className={`h-2 w-8 rounded-full ${currentStep >= 2 ? "bg-purple-600" : "bg-gray-800"}`}
            />
          </View>

          <GestureDetector gesture={panGesture}>
            <View className="relative flex-1">
              <Animated.View
                className="absolute left-0 right-0 top-0 flex-1"
                style={step1AnimatedStyle}
              >
                <View className="flex-1 justify-center">
                  <View className="mb-10 items-center">
                    <Text className="pbk-h4 mb-3 text-center text-base-white">
                      You’ve Been Invited 🎉
                    </Text>

                    <Text className="pbk-b2 px-6 text-center leading-6 text-gray-400">
                      You’re about to join a league with friends. Here’s what
                      you’re stepping into.
                    </Text>
                  </View>

                  {currentLeague && (
                    <View className="rounded-3xl bg-gray-900 p-6 shadow-lg">
                      <Text className="pbk-h5 mb-1 text-center text-base-white">
                        {currentLeague.name}
                      </Text>

                      <View className="mb-8">
                        <View className="mb-2 flex-row items-center justify-between">
                          <Text className="pbk-b2 text-gray-400">
                            Teams Joined
                          </Text>
                          <Text className="pbk-b1 text-base-white">
                            {currentLeague.memberCount} /{" "}
                            {currentLeague.numberOfTeams}
                          </Text>
                        </View>

                        <View className="h-3 overflow-hidden rounded-full bg-gray-800">
                          <View
                            className="h-3 rounded-full bg-white"
                            style={{
                              width: `${
                                (currentLeague.memberCount /
                                  currentLeague.numberOfTeams) *
                                100
                              }%`,
                            }}
                          />
                        </View>
                      </View>

                      <View className="items-center">
                        <Text className="pbk-b2 mb-2 text-gray-400">
                          Team Budget
                        </Text>

                        <Text className="text-4xl font-bold text-base-white">
                          ${(currentLeague.budget / 1_000_000).toFixed(0)}M
                        </Text>

                        <Text className="pbk-b3 mt-2 px-6 text-center text-gray-500">
                          Build your dream team within this salary cap.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>

              <Animated.View
                className="absolute left-0 right-0 top-0 flex-1"
                style={step2AnimatedStyle}
              >
                <View className="flex-1 flex-col">
                  <Controller
                    control={control}
                    name="teamName"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Text className="pbk-b2 mb-1.5 text-base-white">
                          Team Name
                        </Text>
                        <View
                          className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.teamName ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                        >
                          <TextInput
                            autoCapitalize="none"
                            className="flex-1 text-base-white placeholder:pbk-b1"
                            onChangeText={onChange}
                            placeholder="Enter team name"
                            placeholderTextColor="gray"
                            value={value}
                          />
                          {errors.teamName && (
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
                    {errors.teamName ? (
                      <Text className="pbk-b3 text-red-600">
                        {errors.teamName.message}
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
                            onChangeText={onChange}
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

                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    Team logo
                  </Text>
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
              </Animated.View>
            </View>
          </GestureDetector>
        </KeyboardAvoidingView>

        <View className="justify-end bg-gray-950 px-6">
          <View className="mb-6 mt-auto gap-4">
            {currentStep === 1 ? (
              <Button label="Next" onPress={handleNext} />
            ) : (
              <Button
                isLoading={isLoading}
                label="Join League"
                onPress={handleSubmit(handleJoinLeague)}
              />
            )}

            <PressableLink
              className="min-h-12 w-full items-center justify-center rounded-md border border-gray-800 bg-gray-920"
              href="/(protected)/(tabs)"
              label="Cancel"
            />
          </View>
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
          control={control}
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

export default JoinLeague;
