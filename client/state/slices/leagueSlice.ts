import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { League } from "@/types/league";

type LeagueState = {
  currentLeague: League | null;
};

const initialState: LeagueState = {
  currentLeague: null,
};

const leagueSlice = createSlice({
  name: "league",
  initialState,
  reducers: {
    setCurrentLeague: (state, action: PayloadAction<League | null>) => {
      state.currentLeague = action.payload;
    },
    clearCurrentLeague: (state) => {
      state.currentLeague = null;
    },
  },
});

export const selectCurrentLeague = (state: RootState) =>
  state.league.currentLeague;

export const { setCurrentLeague, clearCurrentLeague } = leagueSlice.actions;

export default leagueSlice.reducer;
