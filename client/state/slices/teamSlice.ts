import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { defaultTeamLogo, teamLogoOptions } from "@/types/asset";
import { Augment } from "@/types/augment";
import { Player } from "@/types/player";
import {
  BenchPosition,
  BenchSlot,
  defaultTeam,
  LineupSlot,
  SlotPosition,
  Team,
  UTIL_POSITIONS,
} from "@/types/team";
import { validateAugment } from "@/utils/augmentValidation";
import { isNil, isNotNil } from "@/utils/jsUtils";
import {
  findSlotFromPosition,
  isBenchPosition,
  isPlayerEligibleForPosition,
} from "@/utils/teamUtils";

type SwapPayload = {
  fromPosition: SlotPosition;
  toPosition: SlotPosition;
};

// TODO: Possibly move them into teamUtils.ts
const getNextBenchPosition = (bench: BenchSlot[]): BenchPosition =>
  `BEN${bench.length + 1}` as BenchPosition;

const addBenchSlot = (bench: BenchSlot[], player: Player) => {
  const position = getNextBenchPosition(bench);
  return [...bench, { position, player }];
};

const removeBenchSlot = (
  bench: BenchSlot[],
  position: BenchPosition,
): BenchSlot[] => {
  const filtered = bench.filter((slot) => slot.position !== position);
  return filtered.map((slot, i) => ({
    ...slot,
    position: `BEN${i + 1}` as BenchPosition,
  }));
};

const getSlotfromPosition = (
  bench: BenchSlot[],
  lineup: LineupSlot[],
  position: SlotPosition,
): { lineupSlot: LineupSlot | null; benchSlot: BenchSlot | null } => {
  if (isBenchPosition(position)) {
    const benchSlot = findSlotFromPosition(bench, position);
    return {
      lineupSlot: null,
      benchSlot,
    };
  }

  const lineupSlot = findSlotFromPosition(lineup, position) ?? null;
  return {
    lineupSlot,
    benchSlot: null,
  };
};

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

const swapBenchAndLineup = (
  lineupSlot: LineupSlot,
  benchSlot: BenchSlot,
  currentLineup: LineupSlot[],
  currentBench: BenchSlot[],
) => {
  const { position: lineupPosition, player: lineupPlayer } = lineupSlot;
  const { position: benchPosition, player: benchPlayer } = benchSlot;

  let newLineup = currentLineup;
  let newBench = currentBench;

  if (isNotNil(lineupPlayer)) {
    newBench = swapPlayers(currentBench, benchSlot, {
      position: benchPosition,
      player: lineupPlayer,
    });
  } else {
    newBench = removeBenchSlot(currentBench, benchPosition);
  }

  newLineup = swapPlayers(currentLineup, lineupSlot, {
    position: lineupPosition,
    player: benchPlayer,
  });

  return { newBench, newLineup };
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

      if (positions.length === 0) {
        return;
      }

      // All of the positions the player plays plus any util positions
      const allEligiblePositions = [...positions, ...UTIL_POSITIONS];

      for (const position of allEligiblePositions as SlotPosition[]) {
        const slot = findSlotFromPosition(state.lineup, position);
        if (isNotNil(slot) && isNil(slot.player)) {
          slot.player = player;
          state.balance -= slot.player.salary;
          state.hasUserChanges = true;
          break;
        }
      }
    },
    removePlayerFromLineup: (state, action: PayloadAction<Player>) => {
      const player = action.payload;
      const slot = state.lineup.find(
        (slot) => slot.player && slot.player.id === player.id,
      );
      if (isNotNil(slot) && isNotNil(slot.player)) {
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
        const { newBench, newLineup } = swapBenchAndLineup(
          incomingLineupSlot,
          currentBenchSlot,
          state.lineup,
          state.bench,
        );

        state.lineup = newLineup;
        state.bench = newBench;
        state.hasUserChanges = true;
        return;
      }

      // Case 2 Lineup to Bench
      if (isNotNil(currentLineupSlot) && isNotNil(incomingBenchSlot)) {
        const { newBench, newLineup } = swapBenchAndLineup(
          currentLineupSlot,
          incomingBenchSlot,
          state.lineup,
          state.bench,
        );

        state.lineup = newLineup;
        state.bench = newBench;
        state.hasUserChanges = true;
        return;
      }

      // Case 3: Bench to Bench
      if (isNotNil(currentBenchSlot) && isNotNil(incomingBenchSlot)) {
        state.bench = swapPlayers(
          state.bench,
          currentBenchSlot,
          incomingBenchSlot,
        );
        state.hasUserChanges = true;
        return;
      }

      // Case 4: Lineup to Lineup
      if (isNotNil(currentLineupSlot) && isNotNil(incomingLineupSlot)) {
        const { position: currentPosition, player: currentPlayer } =
          currentLineupSlot;
        const { position: incomingPosition, player: incomingPlayer } =
          incomingLineupSlot;

        // If one of the lineup spots is empty, we can move the player there. The UI does not allow for users to select empty
        // lineup spots players are not eligible for
        if (
          (isNil(currentPlayer) && isNotNil(incomingPlayer)) ||
          (isNil(incomingPlayer) && isNotNil(currentPlayer))
        ) {
          state.lineup = swapPlayers(
            state.lineup,
            currentLineupSlot,
            incomingLineupSlot,
          );
        }

        if (isNotNil(currentPlayer) && isNotNil(incomingPlayer)) {
          const fromEligible = isPlayerEligibleForPosition(
            currentPlayer,
            incomingPosition,
          );
          const toEligible = isPlayerEligibleForPosition(
            incomingPlayer,
            currentPosition,
          );

          if (fromEligible && toEligible) {
            // Direct swap if both players can swap positions
            state.lineup = swapPlayers(
              state.lineup,
              currentLineupSlot,
              incomingLineupSlot,
            );
          }

          if (fromEligible && !toEligible) {
            // If player A can go to Player B's position, but Player B can't go to Player A's position,
            // move Player A to Player B's position, then move Player B to the bench
            const newBench = addBenchSlot(state.bench, incomingPlayer);
            const newLineup = swapPlayers(state.lineup, currentLineupSlot, {
              position: incomingPosition,
              player: null,
            });
            state.bench = newBench;
            state.lineup = newLineup;
          }
        }
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
    setAugment: (state, action: PayloadAction<Augment | undefined>) => {
      state.augment = action.payload;
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

export const selectRosterPlayerCount = (state: RootState): number => {
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

export const selectTeamLogo = createSelector(
  [(state: RootState) => state.team.logoUrl],
  (logoUrl) =>
    teamLogoOptions.find((option) => option.url === logoUrl)?.source ??
    defaultTeamLogo.source,
);

export const {
  setTeam,
  clearTeam,
  addPlayerToLineup,
  removePlayerFromLineup,
  swapPlayersInLineup,
  resetToSavedTeam,
  saveTeam,
  setAugment,
} = teamSlice.actions;

export default teamSlice.reducer;
