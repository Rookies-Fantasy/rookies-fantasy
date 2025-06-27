import { configureStore } from "@reduxjs/toolkit";
import lineupSlice from "./slices/lineupSlice";
import teamSlice from "./slices/teamSlice";
import userSlice from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    team: teamSlice,
    lineup: lineupSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
