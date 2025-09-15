import { Alert } from "react-native";
import { UserController } from "@/controllers/userController";
import { LineupSlot, Team } from "@/types/team";

export type SaveLineupOptions = {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  onFinally?: () => void;
};

export const saveTeamLineup = async (
  userId: string,
  team: Team,
  options: SaveLineupOptions = {},
) => {
  const { onSuccess, onError, onStart, onFinally } = options;

  try {
    onStart?.();

    if (team.balance < 0) {
      Alert.alert(
        "Insufficient balance",
        "Please adjust your selections to stay within your available funds.",
      );
      return;
    }

    if (team.bench.length > 0) {
      Alert.alert(
        "Bench must be empty",
        "You have players on the bench that need to be placed in valid positions or removed from your lineup before saving.",
      );
      return;
    }

    await UserController.saveUserTeamLineup(userId, team.id, {
      lineup: team.lineup,
      balance: team.balance,
    });

    onSuccess?.();
  } catch (error) {
    Alert.alert("Error", "Failed to save your team. Please try again.");
    console.log(error);
    onError?.(error);
  } finally {
    onFinally?.();
  }
};

export const resetTeamLineup = async (
  userId: string,
  teamId: string,
): Promise<{ lineup: LineupSlot[]; balance: number }> => {
  try {
    const savedData = await UserController.getSavedTeamLineup(userId, teamId);
    return savedData;
  } catch (error) {
    console.log(error);
    return { lineup: [], balance: 0 };
  }
};
