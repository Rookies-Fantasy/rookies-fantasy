import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type CurrentUser = {
  avatarUrl?: string;
  createdAt?: Date;
  dateOfBirth?: Date;
  email?: string;
  id: string;
  isLoading: boolean;
  updatedAt?: Date;
  username?: string;
};

const initialState: CurrentUser = {
  id: "",
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

export const selectCurrentUserId = (state: RootState) => state.user.id;

export const selectIsUserSignedIn = (state: RootState): boolean =>
  typeof state.user.id === "string" && state.user.id.length > 0;

export const selectIsRegistered = (state: RootState): boolean =>
  state.user.id !== undefined && state.user.username !== undefined;

export const { setUsername, setUser, setIsLoading, clearUser } =
  userSlice.actions;

export default userSlice.reducer;
