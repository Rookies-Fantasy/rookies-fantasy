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
  Alert,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as yup from "yup";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import {
  CreateLeagueParams,
  LeagueController,
} from "@/controllers/leagueController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { addLeague } from "@/state/slices/leagueSlice";

const schema = yup.object({
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

type FormData = {
  name: string;
  numberOfTeams: number;
  budget: number;
};

const CreateLeague = () => {
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      numberOfTeams: 4,
      budget: 150000000,
    },
    mode: "onSubmit",
  });

  const handleCreateLeague = async (formData: FormData) => {
    Alert.alert(
      "Confirm League Creation",
      `League Name: ${formData.name}\nNumber of Teams: ${formData.numberOfTeams}\nBudget: $${(formData.budget / 1000000).toFixed(0)}M\n\nAre you sure you want to create this league?`,
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
              const params: CreateLeagueParams = {
                name: formData.name,
                numberOfTeams: formData.numberOfTeams,
                budget: formData.budget,
              };

              const league = await LeagueController.createLeague(
                userId,
                params,
              );

              dispatch(addLeague(league));

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
          <ScrollView contentContainerClassName="flex-1 px-6 pt-8">
            <View className="mb-8 flex-row items-center gap-4">
              <Pressable
                className="size-8 items-center justify-center rounded-md border border-gray-900"
                onPress={() => router.back()}
              >
                <ArrowLeft color="white" size={20} weight="bold" />
              </Pressable>
              <Text className="pbk-h5 text-base-white">Create League</Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    League Name
                  </Text>
                  <View
                    className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.name ? "border-red-600" : "border-gray-920"} px-2 py-2`}
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
                    {errors.name && (
                      <WarningCircle color="#dc2626" size={20} weight="bold" />
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
                        const newValue = Math.max(150000000, value - 25000000);
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
                        const newValue = Math.min(250000000, value + 25000000);
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
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="justify-end bg-gray-950 px-6">
          <Button
            isLoading={isLoading}
            label="Create League"
            onPress={handleSubmit(handleCreateLeague)}
          />
        </View>
      </View>
    </Screen>
  );
};

export default CreateLeague;
