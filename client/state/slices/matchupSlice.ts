import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Matchup, defaultMatchup } from "@/types/matchup";

const matchupSlice = createSlice({
  name: "matchup",
  initialState: defaultMatchup,
  reducers: {
    setMatchup: (_, action: PayloadAction<Matchup>) => action.payload,
    clearMatchup: () => defaultMatchup,
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

export const { setMatchup, clearMatchup } = matchupSlice.actions;

export default matchupSlice.reducer;
