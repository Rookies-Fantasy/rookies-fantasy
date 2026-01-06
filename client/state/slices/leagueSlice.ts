import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { League } from "@/types/league";

type LeagueState = {
  userLeagues: League[];
};

const initialState: LeagueState = {
  userLeagues: [],
};

const leagueSlice = createSlice({
  name: "league",
  initialState,
  reducers: {
    setUserLeagues: (state, action: PayloadAction<League[]>) => {
      state.userLeagues = action.payload;
    },
    addLeague: (state, action: PayloadAction<League>) => {
      state.userLeagues.push(action.payload);
    },
    clearLeagues: (state) => {
      state.userLeagues = [];
    },
  },
});

export const selectUserLeagues = (state: RootState) => state.league.userLeagues;

export const { addLeague, clearLeagues, setUserLeagues } = leagueSlice.actions;

export default leagueSlice.reducer;
