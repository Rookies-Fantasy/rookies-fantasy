import { yupResolver } from "@hookform/resolvers/yup";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
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
import { useOwnerRosterCost } from "@/hooks/useOwnerRosterCost";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectCurrentLeague,
  setCurrentLeague,
} from "@/state/slices/leagueSlice";
import { selectTeam, setBalance } from "@/state/slices/teamSlice";
import { selectUserId } from "@/state/slices/userSlice";
import { League } from "@/types/league";
import { getErrorAlertMessage } from "@/utils/errorUtils";
import {
  buildLeagueSettingsSchema,
  getBalanceForBudget,
  getMinEditableTeams,
  getOwnerTeamId,
  isLeagueBudgetLocked,
  isLeagueOpen,
  isLeagueOwner,
  LeagueSettingsFormData,
} from "@/utils/leagueUtils";

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

  const minTeams = getMinEditableTeams(league);
  const isBudgetLocked = isLeagueBudgetLocked(league);
  const isRegistrationClosed = !isLeagueOpen(league);
  const schema = useMemo(
    () => buildLeagueSettingsSchema(minTeams, rosterCost),
    [minTeams, rosterCost],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LeagueSettingsFormData>({
    resolver: yupResolver(schema),
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
          <LeagueSettingsFields
            control={control}
            errors={errors}
            isBudgetLocked={isBudgetLocked}
            isRegistrationClosed={isRegistrationClosed}
            minTeams={minTeams}
            rosterCost={rosterCost}
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
