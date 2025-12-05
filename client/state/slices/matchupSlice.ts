import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Matchup, defaultMatchup } from "@/types/matchup";
import { GameInfo, GameStats } from "@/types/team";
import { calculateFantasyPoints } from "@/utils/fantasyPoints";
import { isNotNil } from "@/utils/jsUtils";

type PlayerGameData = {
  gameInfo: GameInfo;
  gameStats: GameStats;
};

const matchupSlice = createSlice({
  name: "matchup",
  initialState: defaultMatchup,
  reducers: {
    setMatchup: (_, action: PayloadAction<Matchup>) => action.payload,
    clearMatchup: () => defaultMatchup,
    updateMatchupWithLiveData: (
      state,
      action: PayloadAction<{
        date: string;
        updatedHome: Record<string, PlayerGameData | null>;
        updatedAway: Record<string, PlayerGameData | null>;
      }>,
    ) => {
      const newMatchup = state.dailyMatchups[action.payload.date];

      newMatchup.homeTeam.lineup.forEach((o) => {
        if (isNotNil(o.player?.id)) {
          const newData = action.payload.updatedHome[o.player?.id];
          o.gameInfo = newData?.gameInfo;
          if (newData?.gameStats) {
            const calculatedFpts = calculateFantasyPoints(newData.gameStats);
            o.gameStats = { ...newData.gameStats, fpts: calculatedFpts };
          } else {
            o.gameStats = newData?.gameStats;
          }
        }
      });

      newMatchup.awayTeam.lineup.forEach((o) => {
        if (isNotNil(o.player?.id)) {
          const newData = action.payload.updatedAway[o.player?.id];
          o.gameInfo = newData?.gameInfo;
          if (newData?.gameStats) {
            const calculatedFpts = calculateFantasyPoints(newData.gameStats);
            o.gameStats = { ...newData.gameStats, fpts: calculatedFpts };
          } else {
            o.gameStats = newData?.gameStats;
          }
        }
      });

      const homeScore = newMatchup.homeTeam.lineup.reduce(
        (total, slot) => total + (slot.gameStats?.fpts ?? 0),
        0,
      );

      const awayScore = newMatchup.awayTeam.lineup.reduce(
        (total, slot) => total + (slot.gameStats?.fpts ?? 0),
        0,
      );

      newMatchup.homeTeam.score = homeScore;
      newMatchup.awayTeam.score = awayScore;

      state.dailyMatchups[action.payload.date] = newMatchup;
    },
  },
});

export const selectMatchup = (state: RootState) => state.matchup;
export const selectMatchupId = (state: RootState) => state.matchup.id;
export const selectMatchupStatus = (state: RootState) => state.matchup.status;
export const selectDailyMatchups = (state: RootState) =>
  state.matchup.dailyMatchups;
export const selectAwayUserId = (state: RootState) =>
  state.matchup.away.awayUserId;
export const selectHomeUserId = (state: RootState) =>
  state.matchup.home.homeUserId;
export const selectWeeklyAcquisitionsUsed = (state: RootState) => {
  if (state.user.id === state.matchup.home.homeUserId) {
    return state.matchup.home.homeWeeklyAcquisitionsUsed;
  }
  return state.matchup.away.awayWeeklyAcquisitionsUsed;
};

export const { setMatchup, clearMatchup, updateMatchupWithLiveData } =
  matchupSlice.actions;

export default matchupSlice.reducer;
