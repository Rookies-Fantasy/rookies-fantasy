import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { User } from "@/types/userTypes";

const initialState: User = {};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_, action: PayloadAction<User>) => action.payload,
    clearUser: () => initialState,
  },
});

export const selectUserId = (state: RootState) => state.user.id;

export const selectIsUserSignedIn = (state: RootState): boolean =>
  typeof state.user.id === "string" && state.user.id.length > 0;

export const selectIsUserRegistered = (state: RootState): boolean =>
  state.user.id !== undefined &&
  state.user.username !== undefined &&
  state.user.dateOfBirth !== undefined &&
  state.user.avatarUrl !== undefined;

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
