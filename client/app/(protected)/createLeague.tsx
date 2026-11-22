import { yupResolver } from "@hookform/resolvers/yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { ArrowLeft, WarningCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Pressable,
  Image,
  Keyboard,
  Alert,
  Modal,
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
import StepperInput from "@/components/StepperInput";
import { LeagueController } from "@/controllers/leagueController";
import { UserController } from "@/controllers/userController";
import { useLeagueDeadlineBounds } from "@/hooks/useLeagueDeadlineBounds";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setCurrentLeague } from "@/state/slices/leagueSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { Asset, defaultTeamLogo, teamLogoOptions } from "@/types/asset";
import {
  formatDeadlineDate,
  formatLocalDate,
  parseLocalDate,
} from "@/utils/dateUtils";
import { isNil, isNotNil } from "@/utils/jsUtils";
import { getPlayoffTeams } from "@/utils/leagueUtils";

// League configuration constants
const MIN_BUDGET = 150_000_000;
const MAX_BUDGET = 250_000_000;
const BUDGET_STEP = 25_000_000;
const MIN_TEAMS = 4;
const MAX_TEAMS = 20;
const TEAMS_STEP = 2;

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
    .min(MIN_TEAMS, `Minimum teams must be at least ${MIN_TEAMS}`)
    .max(MAX_TEAMS, `Maximum teams is ${MAX_TEAMS}`)
    .typeError("Must be a number"),
  budget: yup
    .number()
    .required("Budget is required")
    .min(MIN_BUDGET, `Budget must be at least $${MIN_BUDGET / 1_000_000}M`)
    .max(MAX_BUDGET, `Budget must be no more than $${MAX_BUDGET / 1_000_000}M`)
    .typeError("Must be a number"),
  deadline: yup.string().required("Registration deadline is required"),
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
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [isDeadlineClamped, setIsDeadlineClamped] = useState(false);
  const {
    bounds: deadlineBounds,
    isLoading: isLoadingDeadlineBounds,
    isError: isDeadlineBoundsError,
  } = useLeagueDeadlineBounds();

  // Animation value for sliding
  const gestureTranslateX = useSharedValue(0);

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateLeagueFormData>({
    resolver: yupResolver(createLeagueSchema),
    defaultValues: {
      leagueName: "",
      numberOfTeams: MIN_TEAMS,
      budget: MIN_BUDGET,
      deadline: "",
      teamName: "",
      abbreviation: "",
      logoUrl: "",
    },
    mode: "onSubmit",
  });

  const numberOfTeams = useWatch({ control, name: "numberOfTeams" });
  const deadlineRange = isNil(deadlineBounds)
    ? null
    : deadlineBounds.byPlayoffTeams[getPlayoffTeams(numberOfTeams)];
  const isCreationClosed = isNotNil(deadlineBounds) && isNil(deadlineRange);

  useEffect(() => {
    if (isNil(deadlineRange)) return;

    const currentDeadline = getValues("deadline");
    if (currentDeadline === "") {
      setValue("deadline", deadlineRange.default);
    } else if (currentDeadline > deadlineRange.latest) {
      setValue("deadline", deadlineRange.latest);
      setIsDeadlineClamped(true);
    }
  }, [deadlineRange, getValues, setValue]);

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
    const isValid = await trigger([
      "leagueName",
      "numberOfTeams",
      "budget",
      "deadline",
    ]);
    if (isValid) {
      gestureTranslateX.value = withTiming(-screenWidth, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      setCurrentStep(2);
    }
  };

  const handleCreateLeague = async (data: CreateLeagueFormData) => {
    setIsLoading(true);
    try {
      const teamId = await UserController.addUserTeam(userId, {
        name: data.teamName,
        abbreviation: data.abbreviation,
        logoUrl: data.logoUrl,
        isLeagueTeam: true,
        balance: data.budget,
      });

      const teamData = await UserController.getUserTeam(userId, teamId);

      const league = await LeagueController.createLeague({
        name: data.leagueName,
        numberOfTeams: data.numberOfTeams,
        budget: data.budget,
        initialTeamId: teamId,
        deadline: data.deadline,
      });

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

      dispatch(setCurrentLeague(league));
      router.dismissAll();
      router.replace("/(protected)/(tabs)");
    } catch (error) {
      console.error("Failed to create league:", error);

      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Failed to create league", `${message}. Please try again.`);
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
                        <StepperInput
                          max={MAX_TEAMS}
                          min={MIN_TEAMS}
                          onChange={onChange}
                          step={TEAMS_STEP}
                          value={value}
                        />
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
                        <StepperInput
                          formatValue={(value) =>
                            `$${(value / 1_000_000).toFixed(0)}M`
                          }
                          max={MAX_BUDGET}
                          min={MIN_BUDGET}
                          onChange={onChange}
                          step={BUDGET_STEP}
                          value={value}
                        />
                      </>
                    )}
                  />
                  <View className="mb-4">
                    {errors.budget ? (
                      <Text className="pbk-b3 text-red-600">
                        {errors.budget.message}
                      </Text>
                    ) : (
                      <Text className="pbk-b3 text-gray-600">
                        Budget range: ${MIN_BUDGET / 1_000_000}M - $
                        {MAX_BUDGET / 1_000_000}M
                      </Text>
                    )}
                  </View>

                  <Controller
                    control={control}
                    name="deadline"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Text className="pbk-b2 mb-1.5 text-base-white">
                          Registration Deadline
                        </Text>
                        <Pressable
                          disabled={isNil(deadlineRange)}
                          onPress={() => {
                            Keyboard.dismiss();
                            setPickerDate(
                              value === "" ? new Date() : parseLocalDate(value),
                            );
                            setShowDeadlinePicker(true);
                          }}
                        >
                          <View
                            className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.deadline || isCreationClosed ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                          >
                            <TextInput
                              className="flex-1 text-base-white placeholder:pbk-b1"
                              editable={false}
                              placeholder={
                                isLoadingDeadlineBounds
                                  ? "Loading dates..."
                                  : "Choose a date"
                              }
                              placeholderTextColor="gray"
                              pointerEvents="none"
                              value={
                                value === "" ? "" : formatDeadlineDate(value)
                              }
                            />
                            {(errors.deadline || isCreationClosed) && (
                              <WarningCircle
                                color="#dc2626"
                                size={20}
                                weight="bold"
                              />
                            )}
                          </View>
                        </Pressable>
                        {isNotNil(deadlineBounds) &&
                          isNotNil(deadlineRange) && (
                            <Modal
                              animationType="slide"
                              onRequestClose={() =>
                                setShowDeadlinePicker(false)
                              }
                              transparent
                              visible={showDeadlinePicker}
                            >
                              <Pressable
                                className="flex-1"
                                onPress={() => setShowDeadlinePicker(false)}
                              >
                                <View className="flex-1 items-center justify-end">
                                  <View className="w-full rounded-t-2xl bg-gray-920 p-8">
                                    <DateTimePicker
                                      display="spinner"
                                      maximumDate={parseLocalDate(
                                        deadlineRange.latest,
                                      )}
                                      minimumDate={parseLocalDate(
                                        deadlineBounds.earliest,
                                      )}
                                      mode="date"
                                      onChange={(_, selectedDate) => {
                                        if (selectedDate) {
                                          setPickerDate(selectedDate);
                                        }
                                      }}
                                      themeVariant="dark"
                                      value={pickerDate}
                                    />
                                    <Button
                                      label="Done"
                                      onPress={() => {
                                        onChange(formatLocalDate(pickerDate));
                                        setIsDeadlineClamped(false);
                                        setShowDeadlinePicker(false);
                                      }}
                                    />
                                  </View>
                                </View>
                              </Pressable>
                            </Modal>
                          )}
                      </>
                    )}
                  />
                  <View className="mb-6">
                    {isCreationClosed ? (
                      <Text className="pbk-b3 text-red-600">
                        League creation is closed for this season
                      </Text>
                    ) : isDeadlineBoundsError ? (
                      <Text className="pbk-b3 text-red-600">
                        Could not load deadline dates
                      </Text>
                    ) : errors.deadline ? (
                      <Text className="pbk-b3 text-red-600">
                        {errors.deadline.message}
                      </Text>
                    ) : isDeadlineClamped ? (
                      <Text className="pbk-b3 text-yellow-500">
                        Moved to the latest date allowed for this league size
                      </Text>
                    ) : (
                      <Text className="pbk-b3 text-gray-600">
                        Registration closes at midnight Pacific Time
                      </Text>
                    )}
                  </View>
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
          {currentStep === 1 ? (
            <Button
              disabled={isCreationClosed}
              label="Next"
              onPress={handleNext}
            />
          ) : (
            <Button
              isLoading={isLoading}
              label="Create League"
              onPress={handleSubmit(handleCreateLeague)}
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
