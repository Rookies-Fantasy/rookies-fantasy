import { yupResolver } from "@hookform/resolvers/yup";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as yup from "yup";
import Button from "@/components/Button";
import LeagueDeadlineField from "@/components/LeagueDeadlineField";
import LeagueSettingsFields from "@/components/LeagueSettingsFields";
import LoadingOverlay from "@/components/LoadingOverlay";
import Screen from "@/components/Screen";
import { LeagueController } from "@/controllers/leagueController";
import { useDeleteLeague } from "@/hooks/useDeleteLeague";
import { useLeagueDeadlineBounds } from "@/hooks/useLeagueDeadlineBounds";
import { useOwnerRosterCost } from "@/hooks/useOwnerRosterCost";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectCurrentLeague,
  setCurrentLeague,
} from "@/state/slices/leagueSlice";
import { selectTeam, setBalance } from "@/state/slices/teamSlice";
import { selectUserId } from "@/state/slices/userSlice";
import { League } from "@/types/league";
import { getPacificDateString } from "@/utils/dateUtils";
import { getErrorAlertMessage } from "@/utils/errorUtils";
import { isNil } from "@/utils/jsUtils";
import {
  buildLeagueSettingsSchema,
  getBalanceForBudget,
  getDeadlineRange,
  getLeagueMembership,
  getMinEditableTeams,
  getOwnerTeamId,
  isLeagueBudgetLocked,
  isLeagueCancelled,
  isLeagueClosed,
  isLeagueOwner,
  isLeagueReopenable,
} from "@/utils/leagueUtils";

const buildEditLeagueSchema = (minTeams: number, rosterCost: number) =>
  buildLeagueSettingsSchema(minTeams, rosterCost).shape({
    deadline: yup.string().defined(),
  });

type EditLeagueFormData = yup.InferType<
  ReturnType<typeof buildEditLeagueSchema>
>;

type EditLeagueFormProps = {
  league: League;
  ownerTeamId: string | null;
  rosterCost: number;
};

const EditLeagueForm = ({
  league,
  ownerTeamId,
  rosterCost,
}: EditLeagueFormProps) => {
  const dispatch = useAppDispatch();
  const team = useAppSelector(selectTeam);
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const { confirmDelete, isDeleting } = useDeleteLeague();
  const {
    bounds: deadlineBounds,
    isLoading: isLoadingDeadlineBounds,
    isError: isDeadlineBoundsError,
  } = useLeagueDeadlineBounds();

  const minTeams = getMinEditableTeams(league);
  const isBudgetLocked = isLeagueBudgetLocked(league);
  const isReopenable = isLeagueReopenable(league);
  const isCancelled = isLeagueCancelled(league);
  const schema = useMemo(
    () => buildEditLeagueSchema(minTeams, rosterCost),
    [minTeams, rosterCost],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditLeagueFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      leagueName: league.name,
      numberOfTeams: league.numberOfTeams,
      budget: league.budget,
      deadline: league.deadline,
    },
    mode: "onSubmit",
  });

  const numberOfTeams = useWatch({ control, name: "numberOfTeams" });
  const pickedDeadline = useWatch({ control, name: "deadline" });
  const deadlineRange = getDeadlineRange(deadlineBounds, numberOfTeams);
  const isDeadlineClamped =
    !isNil(deadlineRange) && pickedDeadline > deadlineRange.latest;
  const deadline =
    isNil(deadlineRange) || !isDeadlineClamped
      ? pickedDeadline
      : deadlineRange.latest;

  const isSeasonOpen = isNil(deadlineBounds) || !isNil(deadlineRange);

  const isRegistrationClosed =
    isLeagueClosed(league, getPacificDateString(new Date())) &&
    deadline === league.deadline;

  const handleSave = async (data: EditLeagueFormData) => {
    setIsLoading(true);
    try {
      const updatedLeague = await LeagueController.updateLeague(league.id, {
        name: data.leagueName,
        numberOfTeams: data.numberOfTeams,
        budget: data.budget,
        deadline,
      });

      dispatch(setCurrentLeague(updatedLeague));
      queryClient.setQueryData(["league", league.id], updatedLeague);

      // The server recomputed the owner's saved balance for the new budget, so
      // the team in the builder follows suit, keeping any unsaved changes.
      if (updatedLeague.budget !== league.budget && team.id === ownerTeamId) {
        dispatch(setBalance(getBalanceForBudget(updatedLeague.budget, team)));
      }

      await queryClient.invalidateQueries({
        queryKey: ["leagueStandings", league.id],
      });
      router.back();
    } catch (error) {
      console.error("Failed to update league:", error);
      Alert.alert("Failed to update league", getErrorAlertMessage(error));
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
          {isCancelled && (
            <View className="mb-6 rounded-xl border border-red-600 bg-red-950 p-4">
              <Text className="pbk-b1 mb-1 text-base-white">
                League cancelled
              </Text>
              <Text className="pbk-b3 text-gray-300">
                {isSeasonOpen
                  ? `Only ${getLeagueMembership(league)} of ${league.numberOfTeams} teams joined. Pick a new registration deadline to reopen the league.`
                  : `Only ${getLeagueMembership(league)} of ${league.numberOfTeams} teams joined, and it's too late in the season to reopen registration.`}
              </Text>
            </View>
          )}

          <LeagueSettingsFields
            control={control}
            errors={errors}
            isBudgetLocked={isBudgetLocked}
            isRegistrationClosed={isRegistrationClosed}
            minTeams={minTeams}
            rosterCost={rosterCost}
          />

          {isReopenable && (
            <Controller
              control={control}
              name="deadline"
              render={({ field: { onChange } }) => (
                <LeagueDeadlineField
                  bounds={deadlineBounds}
                  closedMessage="It's too late in the season to move the deadline"
                  isClamped={isDeadlineClamped}
                  isError={isDeadlineBoundsError}
                  isLoading={isLoadingDeadlineBounds}
                  onChange={onChange}
                  range={deadlineRange}
                  value={deadline}
                />
              )}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="gap-3 bg-gray-950 px-6">
        <Button
          disabled={!isDirty || isDeleting}
          isLoading={isLoading}
          label="Save Changes"
          onPress={handleSubmit(handleSave)}
        />
        {isReopenable && (
          <Button
            disabled={isLoading}
            isLoading={isDeleting}
            label="Delete League"
            onPress={() => confirmDelete(league)}
            variant="secondary"
          />
        )}
      </View>
      <LoadingOverlay isVisible={isDeleting} label="Deleting league..." />
    </View>
  );
};

type EditLeagueContentProps = {
  league: League;
};

const EditLeagueContent = ({ league }: EditLeagueContentProps) => {
  const ownerTeamId = getOwnerTeamId(league);
  const { rosterCost, isLoading } = useOwnerRosterCost(league, ownerTeamId);

  // The budget's floor depends on the roster cost, so the form mounts once
  // that is known.
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <EditLeagueForm
      league={league}
      ownerTeamId={ownerTeamId}
      rosterCost={rosterCost}
    />
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
      <EditLeagueContent league={currentLeague} />
    </Screen>
  );
};

export default EditLeague;
