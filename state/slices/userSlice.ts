import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

type CurrentUser = {
  isLoading: boolean;
  userId?: number;
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
    setDisplayName: (state, action: PayloadAction<string>) => {
      state.displayName = action.payload;
    },
    setUser: (_, action: PayloadAction<CurrentUser>) => {
      return {
        ...action.payload,
        isLoading: false,
      };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const selectCurrentUserId = (state: RootState) => state.user.userId;

export const { setDisplayName, setUser, setLoading } = userSlice.actions;

export default userSlice.reducer;
