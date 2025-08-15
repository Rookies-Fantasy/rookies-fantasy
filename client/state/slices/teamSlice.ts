import { PayloadAction, createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Player } from "@/types/players";
import {
  defaultTeam,
  FlexPosition,
  LineupSlot,
  SlotPosition,
  Team,
} from "@/types/teamTypes";

const teamSlice = createSlice({
  name: "team",
  initialState: defaultTeam,
  reducers: {
    setTeam: (_, action: PayloadAction<Team>) => action.payload,
    clearTeam: () => defaultTeam,
    addPlayerToLineup: (state, action: PayloadAction<Player>) => {
      const player = action.payload;
      const positions = player.positions;

      if (!positions || positions.length === 0) {
        return;
      }

      const findSlotByPosition = (position: SlotPosition) =>
        state.lineup.find((slot) => slot.position === position);

      const isPositionAvailable = (position: SlotPosition) => {
        const slot = findSlotByPosition(position);
        return slot && slot.player === null;
      };

      // Check if primary position (positions[0]) is available
      const primaryPosition = positions[0] as SlotPosition;
      if (isPositionAvailable(primaryPosition)) {
        const slot = findSlotByPosition(primaryPosition);
        if (slot) {
          slot.player = player;
          state.balance -= slot.player.salary;
          return;
        }
      }

      // Look through remaining eligible positions
      for (let i = 1; i < positions.length; i++) {
        const position = positions[i] as SlotPosition;
        if (isPositionAvailable(position)) {
          const slot = findSlotByPosition(position);
          if (slot) {
            slot.player = player;
            state.balance -= slot.player.salary;
            return;
          }
        }
      }

      // Check UTIL positions if no eligible positions are available
      const utilPositions: FlexPosition[] = ["UTIL1", "UTIL2", "UTIL3"];
      for (const utilPosition of utilPositions) {
        if (isPositionAvailable(utilPosition)) {
          const slot = findSlotByPosition(utilPosition);
          if (slot) {
            slot.player = player;
            state.balance -= slot.player.salary;
            return;
          }
        }
      }
    },
    removePlayerFromLineup: (state, action: PayloadAction<Player>) => {
      const player = action.payload;
      const slot = state.lineup.find(
        (slot) => slot.player && slot.player.id === player.id,
      );
      if (slot && slot.player) {
        state.balance += slot.player.salary;
        slot.player = null;
      }
    },
  },
});

export const selectTeam = (state: RootState) => state.team;
export const selectTeamId = (state: RootState) => state.team.id;
export const selectLineup = (state: RootState) => state.team.lineup;

export const selectIsTeamRegistered = createSelector(
  [selectTeam],
  (team): boolean =>
    !!team.id && !!team.abbreviation && !!team.logoUrl && !!team.name,
);

export const selectLineupPlayerCount = createSelector(
  [selectLineup],
  (lineup): number => lineup.filter((slot) => slot.player !== null).length,
);

export const selectEligibleSlotsForPosition = createSelector(
  [selectLineup, (_: RootState, position: SlotPosition) => position],
  (lineup, position): LineupSlot[] => {
    const UTIL_POSITIONS: FlexPosition[] = ["UTIL1", "UTIL2", "UTIL3"];
    const isUtilPosition = UTIL_POSITIONS.includes(position as FlexPosition);

    return lineup.filter((slot) => {
      if (!slot.player) return false;

      return isUtilPosition || slot.player.positions.includes(position);
    });
  },
);

export const isPlayerInLineup = (
  lineup: LineupSlot[],
  playerId: string,
): boolean => lineup.some((slot) => slot.player?.id === playerId);

export const { setTeam, clearTeam, addPlayerToLineup, removePlayerFromLineup } =
  teamSlice.actions;

export default teamSlice.reducer;
