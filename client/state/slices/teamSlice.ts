import { PayloadAction, createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Player } from "@/types/players";
import {
  defaultTeam,
  FlexPosition,
  LineupSlot,
  SlotPosition,
  Team,
  BenchSlot,
  BenchPosition,
  UTIL_POSITIONS,
} from "@/types/team";
import { isNil, isNotNil } from "@/utils/jsUtils";

type SwapPayload = {
  from: SlotPosition;
  to: SlotPosition;
};

// Util functions should maybe be separated into teamUtils or something

export const findSlotFromPosition = <T extends LineupSlot | BenchSlot>(
  arr: T[],
  selectedPosition: SlotPosition,
) => arr.find((slot) => slot.position === selectedPosition);

export const isPlayerInLineup = (
  lineup: LineupSlot[],
  playerId: string,
): boolean => lineup.some((slot) => slot.player?.id === playerId);

export const isPlayerEligibleForPosition = (
  player: Player,
  position: SlotPosition,
) =>
  player.positions.includes(position) ||
  UTIL_POSITIONS.includes(position as FlexPosition);

const getSlotAndPlayer = (
  bench: BenchSlot[],
  lineup: LineupSlot[],
  position: SlotPosition,
) => {
  if (position.toString().startsWith("BEN")) {
    const benchSlot = findBenchSlotByPosition(bench, position as BenchPosition);
    return {
      lineupSlot: null,
      benchSlot,
      player: benchSlot?.player ?? null,
    };
  }

  const lineupSlot = lineup.find((slot) => slot.position === position) ?? null;
  return {
    lineupSlot,
    benchSlot: null,
    player: lineupSlot?.player ?? null,
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
      const { from, to } = action.payload;

      if (from === to) return;

      const fromInfo = getSlotAndPlayer(state.bench, state.lineup, from);
      const toInfo = getSlotAndPlayer(state.bench, state.lineup, to);

      // Case 1: Bench to Lineup or Lineup to Bench
      if (isNotNil(fromInfo.benchSlot) && isNotNil(toInfo.lineupSlot)) {
        const playerToMoveToLineup = fromInfo.player;
        const playerToMoveToBench = toInfo.player;

        if (isNil(playerToMoveToBench)) {
          removeBenchSlot(state.bench, from as BenchPosition);
        } else {
          const newBench = state.bench.map((o) => {
            if (o.player.id === fromInfo.player?.id) {
              return { ...o, player: playerToMoveToBench };
            }
            return o;
          });
          state.bench = newBench;
        }

        // Player cannot be empty if they're from the bench
        if (isNil(playerToMoveToLineup)) return;

        const newLineup = state.lineup.map((o) => {
          if (o.player?.id === toInfo.player?.id) {
            return { ...o, player: playerToMoveToLineup };
          }
          return o;
        });

        state.lineup = newLineup;
        state.hasUserChanges = true;
        return;
      }

      const benchFrom = fromInfo.benchSlot;
      const benchTo = toInfo.benchSlot;

      if (isNotNil(benchFrom) && isNotNil(benchTo)) {
        const newBench = state.bench.map((o) => {
          if (o.position === benchFrom.position) {
            return { ...o, player: benchTo.player };
          }
          if (o.position === benchTo.position) {
            return { ...o, player: benchFrom.player };
          }
          return o;
        });
        state.bench = newBench;

        // const indexFrom = state.bench.findIndex(
        //   (slot) => slot.player?.id === benchFrom.player.id,
        // );
        // const indexTo = state.bench.findIndex(
        //   (slot) => slot.player?.id === benchTo.player.id,
        // );

        // if (indexFrom === -1 || indexTo === -1) return;

        // const newBench = [...state.bench];

        // newBench[indexFrom] = {
        //   ...newBench[indexFrom],
        //   player: benchTo.player,
        // };
        // newBench[indexTo] = { ...newBench[indexTo], player: benchFrom.player };

        state.hasUserChanges = true;
      }

      const lineupTo = fromInfo.lineupSlot;
      const lineupFrom = toInfo.lineupSlot;

      if (isNotNil(lineupFrom) && isNotNil(lineupTo)) {
        if (isNil(lineupFrom.player) && isNotNil(lineupTo.player)) {
          const newLineup = state.lineup.map((o) => {
            if (o.position === lineupFrom.position) {
              return { ...o, player: lineupTo.player };
            }
            if (o.position === lineupTo.position) {
              return { ...o, player: null };
            }
            return o;
          });
          state.lineup = newLineup;
        }

        if (isNil(lineupTo.player) && isNotNil(lineupFrom.player)) {
          const newLineup = state.lineup.map((o) => {
            if (o.position === lineupFrom.position) {
              return { ...o, player: null };
            }
            if (o.position === lineupTo.position) {
              return { ...o, player: lineupFrom.player };
            }
            return o;
          });
          state.lineup = newLineup;
        }

        if (isNotNil(lineupTo.player) && isNotNil(lineupFrom.player)) {
          const playerFromEligibility = isPlayerEligibleForPosition(
            lineupFrom.player,
            lineupTo.position,
          );
          const playerToEligibility = isPlayerEligibleForPosition(
            lineupTo.player,
            lineupFrom.position,
          );

          if (playerFromEligibility && playerToEligibility) {
            // Both players can swap positions - direct swap
            // (TODO: Success toast that confirms the swap)
            const newLineup = state.bench.map((o) => {
              if (o.position === lineupFrom.position) {
                return { ...o, player: lineupTo.player };
              }
              if (o.position === lineupTo.position) {
                return { ...o, player: lineupFrom.player };
              }
              return o;
            });
            state.lineup = newLineup;
          }

          if (playerFromEligibility && !playerToEligibility) {
            // Player A can go to Player B's position, but Player B cannot go to
            // Player A's position. Move Player A to Player B's position,
            // Player B goes to bench
            // (TODO: Success toast that confirms where player B has gone)
            addBenchSlot(state.bench, lineupTo.player);
            const newLineup = state.lineup.map((o) => {
              if (o.position === lineupFrom.position) {
                return { ...o, player: null };
              }
              if (o.position === lineupTo.position) {
                return { ...o, player: lineupFrom.player };
              }
              return o;
            });
            state.lineup = newLineup;
          }

          if (!playerFromEligibility && playerToEligibility) {
            // Player A cannot go to Player B's position, but Player B can go to
            // Player A's position. Move Player B to Player A's position,
            // Player A goes to bench
            // (TODO: Success toast that confirms where player A has gone)
            addBenchSlot(state.bench, lineupFrom.player);
            const newLineup = state.lineup.map((o) => {
              if (o.position === lineupFrom.position) {
                return { ...o, player: lineupTo.player };
              }
              if (o.position === lineupTo.position) {
                return { ...o, player: null };
              }
              return o;
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
    // This is not used
    clearBench: (state) => {
      state.bench = [];
      state.hasUserChanges = true;
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
  clearBench,
  resetToSavedTeam,
  saveTeam,
  setAugmentId,
} = teamSlice.actions;

export default teamSlice.reducer;
