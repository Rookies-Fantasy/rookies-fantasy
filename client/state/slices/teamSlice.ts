import { PayloadAction, createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Augment } from "@/types/augment";
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
import { validateAugment } from "@/utils/augmentValidation";
import { isNotNil } from "@/utils/jsUtils";

type SwapPayload = {
  from: SlotPosition;
  to: SlotPosition;
};

const getNextBenchPosition = (bench: BenchSlot[]): BenchPosition =>
  `BEN${bench.length + 1}` as BenchPosition;

const addPlayerToBench = (bench: BenchSlot[], player: Player): void => {
  const position = getNextBenchPosition(bench);
  bench.push({ position, player });
};

const findBenchSlotByPosition = (
  bench: BenchSlot[],
  position: BenchPosition,
): BenchSlot | null => bench.find((slot) => slot.position === position) ?? null;

const removeBenchSlotByPosition = (
  bench: BenchSlot[],
  position: BenchPosition,
): void => {
  const index = bench.findIndex((slot) => slot.position === position);
  if (index !== -1) {
    bench.splice(index, 1);
    bench.forEach((slot, i) => {
      slot.position = `BEN${i + 1}` as BenchPosition;
    });
  }
};

// TODO: Remove func as not needed in prod
const validateAndLogAugment = (state: Team): void => {
  if (state.augment) {
    const validation = validateAugment(state.augment, state.lineup);

    if (validation.isValid) {
      console.log(
        `Augment "${state.augment.title}" is valid. Qualifying players:`,
        validation.qualifyingPlayers.map((p) => p.firstName + " " + p.lastName),
      );
    } else {
      console.log(
        `Augment "${state.augment.title}" requirements not met:`,
        validation.unmetPrerequisites,
      );
      console.log(
        `Augment "${state.augment.title}" requirements are met:`,
        validation.metPrerequisites,
      );
    }
  }
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
          validateAndLogAugment(state);
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
            validateAndLogAugment(state);
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
            validateAndLogAugment(state);
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
        validateAndLogAugment(state);
      }
    },
    swapPlayersInLineup: (state, action: PayloadAction<SwapPayload>) => {
      const { from, to } = action.payload;

      if (from === to) return;

      // Handle bench positions
      const isBenchFrom = from.toString().startsWith("BEN");
      const isBenchTo = to.toString().startsWith("BEN");

      let fromPlayer: Player | null = null;
      let toPlayer: Player | null = null;

      let fromSlot: LineupSlot | null = null;
      let toSlot: LineupSlot | null = null;

      let fromBenchSlot: BenchSlot | null = null;
      let toBenchSlot: BenchSlot | null = null;

      if (isBenchFrom) {
        fromBenchSlot = findBenchSlotByPosition(
          state.bench,
          from as BenchPosition,
        );
        fromPlayer = fromBenchSlot?.player || null;
      } else {
        fromSlot = state.lineup.find((slot) => slot.position === from) || null;
        fromPlayer = fromSlot?.player || null;
      }

      if (isBenchTo) {
        toBenchSlot = findBenchSlotByPosition(state.bench, to as BenchPosition);
        toPlayer = toBenchSlot?.player || null;
      } else {
        toSlot = state.lineup.find((slot) => slot.position === to) || null;
        toPlayer = toSlot?.player || null;
      }

      if (!fromPlayer && !toPlayer) return;

      // Case 1: Bench to Lineup
      if (isBenchFrom && !isBenchTo && toSlot) {
        if (!fromPlayer || !fromBenchSlot) return;

        const playerEligible =
          fromPlayer.positions.includes(to) ||
          UTIL_POSITIONS.includes(to as FlexPosition);

        if (playerEligible) {
          removeBenchSlotByPosition(state.bench, from as BenchPosition);

          if (toPlayer) {
            addPlayerToBench(state.bench, toPlayer);
          }

          toSlot.player = fromPlayer;
        }
        state.hasUserChanges = true;
        validateAndLogAugment(state);
        return;
      }

      // Case 2: Lineup to Bench
      if (!isBenchFrom && isBenchTo && fromSlot) {
        if (!fromPlayer) return;

        if (toBenchSlot && toPlayer) {
          fromSlot.player = toPlayer;
          toBenchSlot.player = fromPlayer;
        } else {
          addPlayerToBench(state.bench, fromPlayer);
          fromSlot.player = null;
        }
        state.hasUserChanges = true;
        validateAndLogAugment(state);
        return;
      }

      // Case 3: Bench to Bench
      if (isBenchFrom && isBenchTo && fromBenchSlot && toBenchSlot) {
        if (!fromPlayer && !toPlayer) return;

        const tempPlayer = fromBenchSlot.player;
        fromBenchSlot.player = toBenchSlot.player;
        toBenchSlot.player = tempPlayer;
        state.hasUserChanges = true;
        return;
      }

      // Case 4: Lineup to Lineup
      if (!isBenchFrom && !isBenchTo && fromSlot && toSlot) {
        if (!fromPlayer && !toPlayer) return;

        if (fromPlayer && !toPlayer) {
          toSlot.player = fromPlayer;
          fromSlot.player = null;
          state.hasUserChanges = true;
          validateAndLogAugment(state);
          return;
        }

        if (fromPlayer && toPlayer) {
          const playerAEligibility =
            fromPlayer.positions.includes(to) ||
            UTIL_POSITIONS.includes(to as FlexPosition);

          const playerBEligibility =
            toPlayer.positions.includes(from) ||
            UTIL_POSITIONS.includes(from as FlexPosition);

          if (playerAEligibility && playerBEligibility) {
            // Both players can swap positions - direct swap
            // (TODO: Success toast that confirms the swap)
            fromSlot.player = toPlayer;
            toSlot.player = fromPlayer;
          } else if (playerAEligibility && !playerBEligibility) {
            // Player A can go to Player B's position, but Player B cannot go to
            // Player A's position. Move Player A to Player B's position,
            // Player B goes to bench
            // (TODO: Success toast that confirms where player B has gone)
            addPlayerToBench(state.bench, toPlayer);
            toSlot.player = fromPlayer;
            fromSlot.player = null;
          } else if (!playerAEligibility && playerBEligibility) {
            // Player A cannot go to Player B's position, but Player B can go to
            // Player A's position. Move Player B to Player A's position,
            // Player A goes to bench
            // (TODO: Success toast that confirms where player A has gone)
            addPlayerToBench(state.bench, fromPlayer);
            fromSlot.player = toPlayer;
            toSlot.player = null;
          } else {
            // Neither player can go to the other's position
            // Both players go to bench (TODO: Throw an error toast)
            addPlayerToBench(state.bench, fromPlayer);
            addPlayerToBench(state.bench, toPlayer);
            fromSlot.player = null;
            toSlot.player = null;
          }
          state.hasUserChanges = true;
          validateAndLogAugment(state);
          return;
        }

        const tempPlayer = fromSlot.player;
        fromSlot.player = toSlot.player;
        toSlot.player = tempPlayer;
        state.hasUserChanges = true;
        validateAndLogAugment(state);
      }
    },
    removePlayerFromBench: (state, action: PayloadAction<Player>) => {
      const player = action.payload;
      const benchSlot = state.bench.find(
        (slot) => slot.player && slot.player.id === player.id,
      );
      if (benchSlot && benchSlot.player) {
        state.balance += benchSlot.player.salary;
        removeBenchSlotByPosition(state.bench, benchSlot.position);
        state.hasUserChanges = true;
      }
    },
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
      validateAndLogAugment(state);
    },
    saveTeam: (state) => {
      state.hasUserChanges = false;
    },
    setAugment: (state, action: PayloadAction<Augment | undefined>) => {
      state.augment = action.payload;
      validateAndLogAugment(state);
    },
  },
});

export const selectTeam = (state: RootState) => state.team;
export const selectTeamId = (state: RootState) => state.team.id;
export const selectLineup = (state: RootState) => state.team.lineup;
export const selectAugment = (state: RootState) => state.team.augment;

export const selectIsTeamRegistered = createSelector(
  [selectTeam],
  (team): boolean =>
    !!team.id && !!team.abbreviation && !!team.logoUrl && !!team.name,
);

export const getRosterPlayerCount = (state: RootState): number => {
  const lineupCount = state.team.lineup.filter(
    (slot) => slot.player !== null,
  ).length;
  const benchCount = state.team.bench.length;
  return lineupCount + benchCount;
};

export const isPlayerInLineup = (
  lineup: LineupSlot[],
  playerId: string,
): boolean => lineup.some((slot) => slot.player?.id === playerId);

export const getBenchPlayerCount = (state: RootState): number =>
  state.team.bench.filter((slot) => slot.player !== null).length;

export const selectAugmentValidation = createSelector(
  [selectTeam, selectLineup],
  (team, lineup) => validateAugment(team.augment, lineup),
);

export const selectQualifyingPlayers = createSelector(
  [selectAugmentValidation],
  (validation) => validation.qualifyingPlayers,
);

export const selectQualifyingPlayersCount = createSelector(
  [selectAugmentValidation],
  (validation) => validation.qualifyingPlayers.length,
);

export const selectPlayerQualificationMap = createSelector(
  [selectQualifyingPlayers],
  (qualifyingPlayers) =>
    Object.fromEntries(qualifyingPlayers.map((p) => [p.id, true])),
);

export const selectIsAugmentValid = createSelector(
  [selectAugmentValidation],
  (validation) => validation.isValid,
);

export const selectAugmentMetPrerequisites = createSelector(
  [selectAugmentValidation],
  (validation) => validation.metPrerequisites,
);

export const selectAugmentUnmetPrerequisites = createSelector(
  [selectAugmentValidation],
  (validation) => validation.unmetPrerequisites,
);

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
  setAugment,
} = teamSlice.actions;

export default teamSlice.reducer;
