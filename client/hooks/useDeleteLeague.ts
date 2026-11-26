import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { LeagueController } from "@/controllers/leagueController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { clearCurrentLeague } from "@/state/slices/leagueSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { selectUserId } from "@/state/slices/userSlice";
import { League } from "@/types/league";

type UseDeleteLeagueResult = {
  confirmDelete: (league: League) => void;
  isDeleting: boolean;
};

export const useDeleteLeague = (): UseDeleteLeagueResult => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector(selectUserId);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteLeague = async (league: League) => {
    setIsDeleting(true);
    try {
      await LeagueController.deleteLeague(league.id);

      const teams = await UserController.getUserTeams(userId);
      const rankedTeam = teams.find((team) => !team.isLeagueTeam);
      if (rankedTeam) {
        dispatch(
          setTeam(await UserController.getUserTeam(userId, rankedTeam.id)),
        );
      }

      dispatch(clearCurrentLeague());
      queryClient.removeQueries({ queryKey: ["league", league.id] });
      router.replace("/(protected)/(tabs)");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Failed to delete league", `${message}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (league: League) => {
    Alert.alert(
      "Delete league?",
      `${league.name} will be removed for every member. This can't be undone from the app.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteLeague(league),
        },
      ],
    );
  };

  return { confirmDelete, isDeleting };
};
