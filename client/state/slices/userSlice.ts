import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { defaultUser, User } from "@/types/userTypes";
import { isNotNil } from "@/utils/jsUtils";

const initialState: User = { id: "", emailVerified: false };

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_, action: PayloadAction<User>) => action.payload,
    clearUser: () => defaultUser,
  },
});

export const selectUserId = (state: RootState) => state.user.id;

export const selectIsUserSignedIn = (state: RootState): boolean =>
  !!state.user.id;

export const selectIsUserRegistered = (state: RootState): boolean =>
  isNotNil(state.user.id) &&
  isNotNil(state.user.username) &&
  isNotNil(state.user.dateOfBirth) &&
  isNotNil(state.user.avatarUrl);

export const selectIsUserVerified = (state: RootState): boolean =>
  !!state.user.emailVerified;

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
