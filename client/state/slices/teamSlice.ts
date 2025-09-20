import { PayloadAction, createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Player } from "@/types/players";
import {
  defaultTeam,
  LineupSlot,
  SlotPosition,
  Team,
  BenchSlot,
  BenchPosition,
  UTIL_POSITIONS,
} from "@/types/team";
import { isNil, isNotNil } from "@/utils/jsUtils";
import { isPlayerEligibleForPosition } from "@/utils/teamUtils";

type SwapPayload = {
  fromPosition: SlotPosition;
  toPosition: SlotPosition;
};

// TODO: Take a look at refactoring some of these to not mutate state in the function
// Possibly move them into teamUtils.ts
const swapPlayers = <T extends LineupSlot | BenchSlot>(
  arrayToSwap: T[],
  fromSlot?: T,
  toSlot?: T,
) =>
  arrayToSwap.map((o) => {
    if (o.position === fromSlot?.position) {
      return { ...o, player: toSlot?.player };
    }
    if (o.position === toSlot?.position) {
      return { ...o, player: fromSlot?.player };
    }
    return o;
  });

const getSlotfromPosition = (
  bench: BenchSlot[],
  lineup: LineupSlot[],
  position: SlotPosition,
) => {
  if (position.toString().startsWith("BEN")) {
    const benchSlot = findBenchSlotByPosition(bench, position as BenchPosition);
    return {
      lineupSlot: null,
      benchSlot,
    };
  }

  const lineupSlot = lineup.find((slot) => slot.position === position) ?? null;
  return {
    lineupSlot,
    benchSlot: null,
  };
};

const getNextBenchPosition = (bench: BenchSlot[]): BenchPosition =>
  `BEN${bench.length + 1}` as BenchPosition;

const findBenchSlotByPosition = (
  bench: BenchSlot[],
  position: BenchPosition,
): BenchSlot | null => bench.find((slot) => slot.position === position) ?? null;

const removeBenchSlot = (bench: BenchSlot[], position: BenchPosition) => {
  const index = bench.findIndex((slot) => slot.position === position);
  if (index !== -1) {
    bench.splice(index, 1);
    bench.forEach((slot, i) => {
      slot.position = `BEN${i + 1}` as BenchPosition;
    });
  }
};

const addBenchSlot = (bench: BenchSlot[], player: Player) => {
  const position = getNextBenchPosition(bench);
  bench.push({ position, player });
};

const teamSlice = createSlice({
  name: "team",
  initialState: defaultTeam,
  reducers: {
    setTeam: (_, action: PayloadAction<Team>) => ({
      ...action.payload,
      // TODO: This is not a true dirty flag, it's more like a touched flag right now
      // If you make changes and manually change the team back to the original state, this is still true
      hasUserChanges: false,
    }),
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
        return isNotNil(slot) && !isNotNil(slot.player);
      };

      // Check if primary position (positions[0]) is available
      const primaryPosition = positions[0] as SlotPosition;
      if (isPositionAvailable(primaryPosition)) {
        const slot = findSlotByPosition(primaryPosition);
        if (slot) {
          slot.player = player;
          state.balance -= slot.player.salary;
          state.hasUserChanges = true;
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
            state.hasUserChanges = true;
            return;
          }
        }
      }

      // Check UTIL positions if no eligible positions are available
      for (const utilPosition of UTIL_POSITIONS) {
        if (isPositionAvailable(utilPosition)) {
          const slot = findSlotByPosition(utilPosition);
          if (slot) {
            slot.player = player;
            state.balance -= slot.player.salary;
            state.hasUserChanges = true;
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
        state.hasUserChanges = true;
      }
    },
    swapPlayersInLineup: (state, action: PayloadAction<SwapPayload>) => {
      // TODO: Add toasts for all swap actions
      const { fromPosition, toPosition } = action.payload;

      if (fromPosition === toPosition) return;

      const fromSlot = getSlotfromPosition(
        state.bench,
        state.lineup,
        fromPosition,
      );
      const toSlot = getSlotfromPosition(state.bench, state.lineup, toPosition);
      const { benchSlot: currentBenchSlot, lineupSlot: currentLineupSlot } =
        fromSlot;
      const { benchSlot: incomingBenchSlot, lineupSlot: incomingLineupSlot } =
        toSlot;

      // Case 1: Bench to Lineup
      if (isNotNil(currentBenchSlot) && isNotNil(incomingLineupSlot)) {
        const { position: benchPosition, player: benchPlayer } =
          currentBenchSlot;
        const { position: lineupPosition, player: lineupPlayer } =
          incomingLineupSlot;

        if (isNotNil(lineupPlayer)) {
          // Find bench slot that the player who is going to move to the lineup is in, swap him out
          const newBench = swapPlayers(state.bench, currentBenchSlot, {
            position: benchPosition,
            player: lineupPlayer,
          });
          state.bench = newBench;
        } else {
          removeBenchSlot(state.bench, benchPosition);
        }

        // Find lineup slot that the player who's on the lineup is in right now, swap him out
        const newLineup = swapPlayers(state.lineup, incomingLineupSlot, {
          position: lineupPosition,
          player: benchPlayer,
        });
        state.lineup = newLineup;
        state.hasUserChanges = true;
        return;
      }

      // Case 2 Lineup to Bench
      if (isNotNil(currentLineupSlot) && isNotNil(incomingBenchSlot)) {
        const { position: benchPosition, player: benchPlayer } =
          incomingBenchSlot;
        const { position: lineupPosition, player: lineupPlayer } =
          currentLineupSlot;

        if (isNotNil(lineupPlayer)) {
          // Find bench slot that the player who's on the bench is in right now, swap him out
          const newBench = swapPlayers(state.bench, incomingBenchSlot, {
            position: benchPosition,
            player: lineupPlayer,
          });
          state.bench = newBench;
        } else {
          removeBenchSlot(state.bench, benchPosition);
        }

        // Find lineup slot that the player who is going to move to the bench is in, swap him out
        const newLineup = swapPlayers(state.lineup, currentLineupSlot, {
          position: lineupPosition,
          player: benchPlayer,
        });
        state.lineup = newLineup;
        state.hasUserChanges = true;
        return;
      }

      // Case 3: Bench to Bench
      if (isNotNil(currentBenchSlot) && isNotNil(incomingBenchSlot)) {
        const newBench = swapPlayers(
          state.bench,
          currentBenchSlot,
          incomingBenchSlot,
        );
        state.bench = newBench;
        state.hasUserChanges = true;
        return;
      }

      // Case 4: Lineup to Lineup
      if (isNotNil(currentLineupSlot) && isNotNil(incomingLineupSlot)) {
        const { position: currentPosition, player: currentPlayer } =
          currentLineupSlot;
        const { position: incomingPosition, player: incomingPlayer } =
          incomingLineupSlot;

        if (isNil(currentPlayer) && isNotNil(incomingPlayer)) {
          const newLineup = swapPlayers(
            state.lineup,
            currentLineupSlot,
            incomingLineupSlot,
          );
          state.lineup = newLineup;
        }

        if (isNil(incomingPlayer) && isNotNil(currentPlayer)) {
          const newLineup = swapPlayers(
            state.lineup,
            currentLineupSlot,
            incomingLineupSlot,
          );
          state.lineup = newLineup;
        }

        if (isNotNil(currentPlayer) && isNotNil(incomingPlayer)) {
          const playerFromEligibility = isPlayerEligibleForPosition(
            currentPlayer,
            incomingPosition,
          );
          const playerToEligibility = isPlayerEligibleForPosition(
            incomingPlayer,
            currentPosition,
          );

          if (playerFromEligibility && playerToEligibility) {
            // Direct swap if both players can swap positions
            const newLineup = swapPlayers(
              state.lineup,
              currentLineupSlot,
              incomingLineupSlot,
            );
            state.lineup = newLineup;
          }

          if (playerFromEligibility && !playerToEligibility) {
            // If player A can go to Player B's position, but Player B can't go to Player A's position,
            // move Player A to Player B's position, then move Player B to the bench
            addBenchSlot(state.bench, incomingPlayer);
            const newLineup = swapPlayers(state.lineup, currentLineupSlot, {
              position: incomingPosition,
              player: null,
            });
            state.lineup = newLineup;
          }
        }

        state.hasUserChanges = true;
      }
    },
    removePlayerFromBench: (state, action: PayloadAction<Player>) => {
      const player = action.payload;
      const benchSlot = state.bench.find(
        (slot) => slot.player && slot.player.id === player.id,
      );
      if (benchSlot && benchSlot.player) {
        state.balance += benchSlot.player.salary;
        removeBenchSlot(state.bench, benchSlot.position);
        state.hasUserChanges = true;
      }
    },
    resetToSavedTeam: (
      state,
      action: PayloadAction<{ lineup: LineupSlot[]; balance: number }>,
    ) => {
      state.lineup = action.payload.lineup;
      state.bench = [];
      state.balance = action.payload.balance;
      state.hasUserChanges = false;
    },
    saveTeam: (state) => {
      state.hasUserChanges = false;
    },
    setAugmentId: (state, action: PayloadAction<string | undefined>) => {
      state.augmentId = action.payload;
    },
  },
});

export const selectTeam = (state: RootState) => state.team;
export const selectTeamId = (state: RootState) => state.team.id;
export const selectLineup = (state: RootState) => state.team.lineup;
export const selectAugmentId = (state: RootState) => state.team.augmentId;

export const selectIsTeamRegistered = createSelector(
  [selectTeam],
  (team): boolean =>
    !!team.id && !!team.abbreviation && !!team.logoUrl && !!team.name,
);

export const selectRosterPlayerCount = (state: RootState): number => {
  const lineupCount = state.team.lineup.filter(
    (slot) => slot.player !== null,
  ).length;
  const benchCount = state.team.bench.length;
  return lineupCount + benchCount;
};

export const {
  setTeam,
  clearTeam,
  addPlayerToLineup,
  removePlayerFromLineup,
  swapPlayersInLineup,
  removePlayerFromBench,
  resetToSavedTeam,
  saveTeam,
  setAugmentId,
} = teamSlice.actions;

export default teamSlice.reducer;
