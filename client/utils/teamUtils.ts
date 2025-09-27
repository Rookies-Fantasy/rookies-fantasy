import { Alert } from "react-native";
import { UserController } from "@/controllers/userController";
import { Player } from "@/types/players";
import {
  BenchSlot,
  FlexPosition,
  LineupSlot,
  SlotPosition,
  Team,
  UTIL_POSITIONS,
} from "@/types/team";

export type SaveLineupOptions = {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  onFinally?: () => void;
};

export const isTeamReadyForQueue = (lineup: LineupSlot[]) => {
  const ROSTER_SIZE = 8;
  const filledSlots = lineup.filter((slot) => slot.player !== null).length;

  return ROSTER_SIZE === lineup.length && filledSlots === ROSTER_SIZE;
};

export const findSlotFromPosition = <T extends LineupSlot | BenchSlot>(
  arr: T[],
  selectedPosition: SlotPosition,
) => arr.find((slot) => slot.position === selectedPosition) ?? null;

export const isPlayerInLineup = (lineup: LineupSlot[], playerId: string) =>
  lineup.some((slot) => slot.player?.id === playerId);

export const isPlayerEligibleForPosition = (
  player: Player,
  position: SlotPosition,
) =>
  player.positions.includes(position) ||
  UTIL_POSITIONS.includes(position as FlexPosition);

export const isBenchPosition = (position: SlotPosition) =>
  position.startsWith("BEN");

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

export const resetTeamLineup = async (userId: string, teamId: string) => {
  try {
    const savedData = await UserController.getSavedTeamLineup(userId, teamId);
    return savedData;
  } catch (error) {
    console.log(error);
    return { lineup: [], balance: 0 };
  }
};
