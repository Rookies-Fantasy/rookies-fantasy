import { yupResolver } from "@hookform/resolvers/yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { ArrowLeft, WarningCircle } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Pressable,
  Modal,
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
import { getMinimumSeasonStartDate } from "@/utils/dateUtils";

const schema = yup.object({
  name: yup
    .string()
    .required("League name is required")
    .max(50, "League name must be at most 50 characters"),
  description: yup
    .string()
    .max(200, "Description must be at most 200 characters")
    .default(""),
  seasonStartDate: yup
    .date()
    .required("Season start date is required")
    .test("is-monday", "Season must start on a Monday", (value) => {
      if (!value) return false;
      return value.getDay() === 1;
    })
    .min(
      getMinimumSeasonStartDate(),
      "Season must start on the next upcoming Monday or later",
    ),
  minTeams: yup
    .number()
    .required("Minimum teams is required")
    .min(4, "Minimum teams must be at least 4")
    .typeError("Must be a number"),
  maxTeams: yup
    .number()
    .required("Maximum teams is required")
    .min(4, "Maximum teams must be at least 4")
    .test(
      "max-greater-than-min",
      "Maximum teams must be greater than or equal to minimum teams",
      function (value) {
        const { minTeams } = this.parent;
        return value >= minTeams;
      },
    )
    .typeError("Must be a number"),
  budget: yup
    .number()
    .required("Budget is required")
    .positive("Budget must be positive")
    .typeError("Must be a number"),
});

type FormData = {
  name: string;
  description: string;
  seasonStartDate: Date;
  minTeams: number;
  maxTeams: number;
  budget: number;
};

const CreateLeague = () => {
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();
  const minStartDate = useMemo(() => getMinimumSeasonStartDate(), []);

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(minStartDate);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      seasonStartDate: minStartDate,
      minTeams: 4,
      maxTeams: 10,
      budget: 150000000,
    },
    mode: "onSubmit",
  });

  const handleCreateLeague = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const params: CreateLeagueParams = {
        name: formData.name,
        description: formData.description,
        seasonStartDate: formData.seasonStartDate.toISOString().split("T")[0],
        config: {
          minTeams: formData.minTeams,
          maxTeams: formData.maxTeams,
          budget: formData.budget,
        },
      };

      const league = await LeagueController.createLeague(userId, params);

      dispatch(addLeague(league));

      router.back();
    } catch (error) {
      console.error("Failed to create league: ", error);
    } finally {
      setIsLoading(false);
    }
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
              name="description"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    Description (Optional)
                  </Text>
                  <View
                    className={`mb-2 min-h-24 w-full flex-row items-start rounded-xl border ${errors.description ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                  >
                    <TextInput
                      autoCapitalize="sentences"
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      maxLength={50}
                      onChangeText={onChange}
                      placeholder="Enter league description"
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
              {errors.description && (
                <Text className="pbk-b3 text-red-600">
                  {errors.description.message}
                </Text>
              )}
            </View>

            <Controller
              control={control}
              name="seasonStartDate"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    Season Start Date
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedDate(value ?? getMinimumSeasonStartDate());
                      setShowDatePicker(true);
                    }}
                  >
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${
                        errors.seasonStartDate
                          ? "border-red-600"
                          : "border-gray-920"
                      } px-2 py-2`}
                    >
                      <TextInput
                        className="flex-1 text-base-white placeholder:pbk-b1"
                        editable={false}
                        placeholder="Select season start date"
                        placeholderTextColor="gray"
                        pointerEvents="none"
                        value={
                          value
                            ? new Date(value).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : ""
                        }
                      />
                      {errors.seasonStartDate && (
                        <WarningCircle
                          color="#dc2626"
                          size={20}
                          weight="bold"
                        />
                      )}
                    </View>
                  </Pressable>
                  <Modal
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                    transparent
                    visible={showDatePicker}
                  >
                    <Pressable
                      className="flex-1"
                      onPress={() => setShowDatePicker(false)}
                    >
                      <View className="flex-1 items-center justify-end">
                        <View className="w-full rounded-t-2xl bg-gray-920 p-8">
                          <DateTimePicker
                            display="spinner"
                            minimumDate={minStartDate}
                            mode="date"
                            onChange={(_, selectedDate) => {
                              if (selectedDate) {
                                setSelectedDate(selectedDate);
                                onChange(selectedDate);
                              }
                            }}
                            themeVariant="dark"
                            value={
                              value &&
                              value instanceof Date &&
                              !isNaN(value.getTime())
                                ? value
                                : getMinimumSeasonStartDate()
                            }
                          />
                          <Button
                            label="Done"
                            onPress={() => {
                              if (selectedDate) {
                                onChange(selectedDate);
                              }
                              setShowDatePicker(false);
                            }}
                          />
                        </View>
                      </View>
                    </Pressable>
                  </Modal>
                </>
              )}
            />
            <View className="mb-6">
              {errors.seasonStartDate ? (
                <Text className="pbk-b3 text-red-600">
                  {errors.seasonStartDate.message}
                </Text>
              ) : (
                <Text className="pbk-b3 text-gray-600">
                  Season must start on a Monday (minimum: next Monday)
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
