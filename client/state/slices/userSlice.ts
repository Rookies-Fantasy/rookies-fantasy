import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { CurrentUser } from "@/types/userTypes";

const initialState: CurrentUser = {};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_, action: PayloadAction<CurrentUser>) => ({
      ...action.payload,
    }),
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    clearUser: () => initialState,
  },
});

export const selectCurrentUserId = (state: RootState) => state.user.userId;

export const selectIsUserSignedIn = (state: RootState): boolean =>
  typeof state.user.userId === "string" && state.user.userId.length > 0;

export const selectIsRegistered = (state: RootState): boolean =>
  state.user.userId !== undefined && state.user.username !== undefined;

export const { setUsername, setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
