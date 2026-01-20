import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import { ArrowLeft, WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Pressable,
  Image,
  Keyboard,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { LeagueController } from "@/controllers/leagueController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setCurrentLeague } from "@/state/slices/leagueSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { Asset, defaultTeamLogo, teamLogoOptions } from "@/types/asset";

// Combined schema for league + team
const createLeagueSchema = yup.object({
  // League fields
  leagueName: yup
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
  // Team fields
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

type CreateLeagueFormData = yup.InferType<typeof createLeagueSchema>;

const SWIPE_THRESHOLD = 50;

const CreateLeague = () => {
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();
  const { width: screenWidth } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogoOption, setSelectedLogoOption] =
    useState<Asset>(defaultTeamLogo);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);

  // Animation values for sliding
  const translateX = useSharedValue(0);
  const gestureTranslateX = useSharedValue(0);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CreateLeagueFormData>({
    resolver: yupResolver(createLeagueSchema),
    defaultValues: {
      leagueName: "",
      numberOfTeams: 4,
      budget: 150000000,
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
      // Only allow dragging within bounds
      const baseX = currentStep === 1 ? 0 : -screenWidth;
      let newX = baseX + event.translationX;

      // Clamp the value so you can't swipe past step 1 or step 2
      if (newX > 0) newX = 0;
      if (newX < -screenWidth) newX = -screenWidth;

      gestureTranslateX.value = newX;
    })
    .onEnd((event) => {
      const baseX = currentStep === 1 ? 0 : -screenWidth;
      const dragDistance = event.translationX;

      // Swipe left (go to step 2) - only from step 1
      if (currentStep === 1 && dragDistance < -SWIPE_THRESHOLD) {
        gestureTranslateX.value = withTiming(-screenWidth, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        translateX.value = -screenWidth;
        runOnJS(goToStep2)();
      }
      // Swipe right (go to step 1) - only from step 2
      else if (currentStep === 2 && dragDistance > SWIPE_THRESHOLD) {
        gestureTranslateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        translateX.value = 0;
        runOnJS(goToStep1)();
      }
      // Snap back to current step
      else {
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
    // Validate only step 1 fields
    const isValid = await trigger(["leagueName", "numberOfTeams", "budget"]);
    if (isValid) {
      gestureTranslateX.value = withTiming(-screenWidth, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      translateX.value = -screenWidth;
      setCurrentStep(2);
    }
  };

  const handleCreateLeague = async (data: CreateLeagueFormData) => {
    setIsLoading(true);
    try {
      // Create team first
      const teamId = await UserController.addUserTeam(userId, {
        name: data.teamName,
        abbreviation: data.abbreviation,
        logoUrl: data.logoUrl,
        isLeagueTeam: true,
        balance: data.budget,
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

      // Create the league with the team
      const league = await LeagueController.createLeague(userId, {
        name: data.leagueName,
        numberOfTeams: data.numberOfTeams,
        budget: data.budget,
        initalTeamId: teamId,
      });

      dispatch(setCurrentLeague(league));
      router.replace("/(protected)/(tabs)");
    } catch (error) {
      console.error("Failed to create league:", error);
      Alert.alert("Error", "Failed to create league. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 overflow-hidden">
        <KeyboardAvoidingView
          behavior="padding"
          className="mt-8 flex-1 flex-col px-6"
        >
          {/* Header */}
          <View className="mb-8 flex-row items-center gap-4">
            <Pressable
              className="size-8 items-center justify-center rounded-md border border-gray-900"
              onPress={() => router.back()}
            >
              <ArrowLeft color="white" size={20} weight="bold" />
            </Pressable>
            <Text className="pbk-h5 text-base-white">
              {currentStep === 1 ? "Create League" : "Create Your Team"}
            </Text>
          </View>

          {/* Step indicators */}
          <View className="mb-6 flex-row justify-center gap-2">
            <View
              className={`h-2 w-8 rounded-full ${currentStep >= 1 ? "bg-purple-600" : "bg-gray-800"}`}
            />
            <View
              className={`h-2 w-8 rounded-full ${currentStep >= 2 ? "bg-purple-600" : "bg-gray-800"}`}
            />
          </View>

          {/* Form container with swipe gesture */}
          <GestureDetector gesture={panGesture}>
            <View className="relative flex-1">
              {/* Step 1: League Details */}
              <Animated.View
                className="absolute left-0 right-0 top-0 flex-1"
                style={step1AnimatedStyle}
              >
                <View className="flex-1 flex-col">
                  <Controller
                    control={control}
                    name="leagueName"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Text className="pbk-b2 mb-1.5 text-base-white">
                          League Name
                        </Text>
                        <View
                          className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.leagueName ? "border-red-600" : "border-gray-920"} px-2 py-2`}
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
                          {errors.leagueName && (
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
                    {errors.leagueName ? (
                      <Text className="pbk-b3 text-red-600">
                        {errors.leagueName.message}
                      </Text>
                    ) : (
                      <Text className="pbk-b3 text-gray-600">
                        Choose a name of your league
                      </Text>
                    )}
                  </View>

                  <Controller
                    control={control}
                    name="numberOfTeams"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Text className="pbk-b2 mb-1.5 text-base-white">
                          Number of Teams
                        </Text>
                        <View
                          className={`mb-2 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${errors.numberOfTeams ? "border-red-600" : "border-gray-920"} px-4 py-2`}
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

                          <Text className="pbk-h6 text-base-white">
                            {value}
                          </Text>

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
                    {errors.numberOfTeams ? (
                      <Text className="pbk-b3 text-red-600">
                        {errors.numberOfTeams.message}
                      </Text>
                    ) : (
                      <Text className="pbk-b3 text-gray-600">
                        Minimum teams required to start the league
                      </Text>
                    )}
                  </View>

                  <Controller
                    control={control}
                    name="budget"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Text className="pbk-b2 mb-1.5 text-base-white">
                          Team Budget
                        </Text>
                        <View
                          className={`mb-2 min-h-14 w-full flex-row items-center justify-between rounded-xl border ${errors.budget ? "border-red-600" : "border-gray-920"} px-4 py-2`}
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
                    {errors.budget ? (
                      <Text className="pbk-b3 text-red-600">
                        {errors.budget.message}
                      </Text>
                    ) : (
                      <Text className="pbk-b3 text-gray-600">
                        Budget range: $150M - $250M
                      </Text>
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* Step 2: Team Details */}
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

        {/* Bottom button */}
        <View className="justify-end bg-gray-950 px-6">
          {currentStep === 1 ? (
            <Button label="Next" onPress={handleNext} />
          ) : (
            <Button
              isLoading={isLoading}
              label="Create League"
              onPress={handleSubmit(handleCreateLeague)}
            />
          )}
        </View>
      </View>

      {/* Logo picker bottom sheet */}
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

export default CreateLeague;
