import { yupResolver } from "@hookform/resolvers/yup";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Button from "@/components/Button";
import LeagueSettingsFields from "@/components/LeagueSettingsFields";
import Screen from "@/components/Screen";
import { LeagueController } from "@/controllers/leagueController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectCurrentLeague,
  setCurrentLeague,
} from "@/state/slices/leagueSlice";
import { selectUserId } from "@/state/slices/userSlice";
import { League } from "@/types/league";
import {
  buildLeagueSettingsSchema,
  getMinEditableTeams,
  isLeagueBudgetLocked,
  isLeagueOwner,
  LeagueSettingsFormData,
} from "@/utils/leagueUtils";

type EditLeagueFormProps = {
  league: League;
};

const EditLeagueForm = ({ league }: EditLeagueFormProps) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const minTeams = getMinEditableTeams(league);
  const isBudgetLocked = isLeagueBudgetLocked(league);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LeagueSettingsFormData>({
    resolver: yupResolver(buildLeagueSettingsSchema(minTeams)),
    defaultValues: {
      leagueName: league.name,
      numberOfTeams: league.numberOfTeams,
      budget: league.budget,
    },
    mode: "onSubmit",
  });

  const handleSave = async (data: LeagueSettingsFormData) => {
    setIsLoading(true);
    try {
      const updatedLeague = await LeagueController.updateLeague(league.id, {
        name: data.leagueName,
        numberOfTeams: data.numberOfTeams,
        budget: data.budget,
      });

      dispatch(setCurrentLeague(updatedLeague));
      await queryClient.invalidateQueries({
        queryKey: ["leagueStandings", league.id],
      });
      router.back();
    } catch (error) {
      console.error("Failed to update league:", error);

      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Failed to update league", `${message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
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
          <Text className="pbk-h5 text-base-white">Edit League</Text>
        </View>

        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <LeagueSettingsFields
            control={control}
            errors={errors}
            isBudgetLocked={isBudgetLocked}
            minTeams={minTeams}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="justify-end bg-gray-950 px-6">
        <Button
          disabled={!isDirty}
          isLoading={isLoading}
          label="Save Changes"
          onPress={handleSubmit(handleSave)}
        />
      </View>
    </View>
  );
};

const EditLeague = () => {
  const userId = useAppSelector(selectUserId);
  const currentLeague = useAppSelector(selectCurrentLeague);

  // Only the owner can reach this screen. The server enforces the same rule,
  // so this only guards against a stale navigation.
  if (currentLeague === null || !isLeagueOwner(currentLeague, userId)) {
    return <Redirect href="/(protected)/(tabs)/leaderboard" />;
  }

  return (
    <Screen>
      <EditLeagueForm league={currentLeague} />
    </Screen>
  );
};

export default EditLeague;
