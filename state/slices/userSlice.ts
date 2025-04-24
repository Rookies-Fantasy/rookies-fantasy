import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type CurrentUser = {
  isLoading: boolean;
  userId?: string;
  username?: string;
  email?: string;
  displayName?: string;
  dob?: string;
  avatar?: string;
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
    setDisplayName: (state, action: PayloadAction<string>) => {
      state.displayName = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearUser: () => {
      return { isLoading: true };
    },
  },
});

export const selectCurrentUserId = (state: RootState) => state.user.userId;

export const { setDisplayName, setUser, setLoading, clearUser } =
  userSlice.actions;

export default userSlice.reducer;
