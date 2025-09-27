import { configureStore } from "@reduxjs/toolkit";
import queueSlice from "./slices/queueSlice";
import teamSlice from "./slices/teamSlice";
import userSlice from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    team: teamSlice,
    queue: queueSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
