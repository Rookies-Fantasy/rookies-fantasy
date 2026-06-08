import { configureStore } from "@reduxjs/toolkit";
import leagueSlice from "./slices/leagueSlice";
import matchupSlice from "./slices/matchupSlice";
import teamSlice from "./slices/teamSlice";
import userSlice from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    team: teamSlice,
    matchup: matchupSlice,
    league: leagueSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
