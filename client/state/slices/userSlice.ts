import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type CurrentUser = {
  isLoading: boolean;
  userId?: string;
  username?: string;
  email?: string;
  dob?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
};

const initialState: CurrentUser = {
  isLoading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_, action: PayloadAction<CurrentUser>) => {
      return {
        ...action.payload,
      };
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearUser: () => initialState,
  },
});

export const selectCurrentUserId = (state: RootState) => state.user.userId;

export const selectIsUserSignedIn = (state: RootState): boolean =>
  typeof state.user.userId === "string" && state.user.userId.length > 0;

export const selectIsRegistered = (state: RootState): boolean =>
  state.user.userId !== undefined && state.user.username !== undefined;

export const { setUsername, setUser, setIsLoading, clearUser } =
  userSlice.actions;

export default userSlice.reducer;
