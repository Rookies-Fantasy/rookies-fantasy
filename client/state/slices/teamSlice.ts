import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Player } from "@/types/players";
import {
  defaultTeam,
  FlexPosition,
  LineupSlot,
  SlotPosition,
  Team,
} from "@/types/teamTypes";

type SwapPayload = {
  from: SlotPosition;
  to: SlotPosition;
};

const UTIL_POSITIONS: FlexPosition[] = ["UTIL1", "UTIL2", "UTIL3"];

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
          state.balance += slot.player.salary * -1;
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
            state.balance += slot.player.salary * -1;
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
            state.balance += slot.player.salary * -1;
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
    swapPlayersInLineup: (state, action: PayloadAction<SwapPayload>) => {
      const { from, to } = action.payload;

      console.log(to);

      const fromSlot = state.lineup.find((slot) => slot.position === from);
      const toSlot = state.lineup.find((slot) => slot.position === to);

      if (!fromSlot || !toSlot) return;

      const playerA = fromSlot.player;
      const playerB = toSlot.player;

      console.log(playerA?.firstName);
      console.log(playerB?.firstName);

      if (from === to || (!playerA && !playerB)) return;

      if (playerA && !playerB) {
        toSlot.player = playerA;
        fromSlot.player = null;
        return;
      }

      if (playerA && playerB) {
        const playerAEligibility =
          playerA.positions.includes(to) ||
          UTIL_POSITIONS.includes(to as FlexPosition);
        console.log(playerAEligibility);

        if (playerAEligibility) {
          fromSlot.player = playerB;
          toSlot.player = playerA;
          return;
        } else {
          const utilSlot = state.lineup.find(
            (slot) =>
              UTIL_POSITIONS.includes(slot.position as FlexPosition) &&
              !slot.player,
          );

          console.log(utilSlot);

          if (utilSlot) {
            toSlot.player = null;
            utilSlot.player = playerA;
            fromSlot.player = playerB;
            return;
          } else {
            return;
          }
        }
      }

      const tempPlayer = fromSlot.player;
      fromSlot.player = toSlot.player;
      toSlot.player = tempPlayer;
    },
  },
});

export const selectTeamId = (state: RootState) => state.team.id;

export const selectIsTeamRegistered = (state: RootState): boolean =>
  !!state.team.id &&
  !!state.team.abbreviation &&
  !!state.team.logoUrl &&
  !!state.team.name;

export const getLineupPlayerCount = (state: RootState): number =>
  state.team.lineup.filter((slot) => slot.player !== null).length;

export const isPlayerInLineup = (
  lineup: LineupSlot[],
  playerId: string,
): boolean => lineup.some((slot) => slot.player?.id === playerId);

export const {
  setTeam,
  clearTeam,
  addPlayerToLineup,
  removePlayerFromLineup,
  swapPlayersInLineup,
} = teamSlice.actions;

export default teamSlice.reducer;
