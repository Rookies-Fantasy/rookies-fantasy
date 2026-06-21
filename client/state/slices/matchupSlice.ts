import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { GameInfo, GameStats, Matchup } from "@/types/matchup";
import { calculateFantasyPoints } from "@/utils/fantasyPoints";
import { isNil, isNotNil } from "@/utils/jsUtils";

type PlayerGameData = {
  gameInfo: GameInfo;
  gameStats: GameStats;
};

export type MatchupState = {
  data?: Matchup;
};

const defaultMatchup: MatchupState = {
  data: undefined,
};

const matchupSlice = createSlice({
  name: "matchup",
  initialState: defaultMatchup,
  reducers: {
    setMatchup: (state, action: PayloadAction<Matchup>) => {
      state.data = action.payload;
    },
    clearMatchup: () => defaultMatchup,
    updateMatchupWithLiveData: (
      state,
      action: PayloadAction<{
        date: string;
        updatedHome: Record<string, PlayerGameData | null>;
        updatedAway: Record<string, PlayerGameData | null>;
      }>,
    ) => {
      if (isNil(state.data)) {
        return;
      }

      const updateSnapshot = (
        snapshot: Matchup["homeLineupSnapshots"][string] | undefined,
        liveData: Record<string, PlayerGameData | null>,
      ) => {
        snapshot?.forEach((slot) => {
          const newData = liveData[slot.playerSnapshot.id];

          if (isNotNil(newData?.gameInfo)) {
            slot.playerSnapshot.gameInfo = newData.gameInfo;
          }

          if (isNotNil(newData?.gameStats)) {
            const fantasyPoints = calculateFantasyPoints(newData.gameStats);
            slot.playerSnapshot.gameStats = {
              ...newData.gameStats,
              fantasyPoints,
            };
          }
        });
      };

      updateSnapshot(
        state.data.homeLineupSnapshots[action.payload.date],
        action.payload.updatedHome,
      );
      updateSnapshot(
        state.data.awayLineupSnapshots[action.payload.date],
        action.payload.updatedAway,
      );

      state.data.homeScore = Object.values(state.data.homeLineupSnapshots)
        .flat()
        .reduce(
          (total, slot) =>
            total + (slot.playerSnapshot.gameStats?.fantasyPoints ?? 0),
          0,
        );
      state.data.awayScore = Object.values(state.data.awayLineupSnapshots)
        .flat()
        .reduce(
          (total, slot) =>
            total + (slot.playerSnapshot.gameStats?.fantasyPoints ?? 0),
          0,
        );
    },
  },
});

export const selectMatchup = (state: RootState) => state.matchup.data;
export const selectMatchupId = (state: RootState) => state.matchup.data?.id;
export const selectHomeLineupSnapshots = (state: RootState) =>
  state.matchup.data?.homeLineupSnapshots;
export const selectAwayLineupSnapshots = (state: RootState) =>
  state.matchup.data?.awayLineupSnapshots;
export const selectAwayUserId = (state: RootState) =>
  state.matchup.data?.awayUserId;
export const selectHomeUserId = (state: RootState) =>
  state.matchup.data?.homeUserId;

export const { setMatchup, clearMatchup, updateMatchupWithLiveData } =
  matchupSlice.actions;

export default matchupSlice.reducer;
