import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { defaultTeam, Team } from "@/types/team";

const teamSlice = createSlice({
  name: "team",
  initialState: defaultTeam,
  reducers: {
    setTeam: (_, action: PayloadAction<Team>) => action.payload,
    clearTeam: () => defaultTeam,
    setAugmentId: (state, action: PayloadAction<string | undefined>) => {
      state.augmentId = action.payload;
    },
  },
});

export const selectTeamId = (state: RootState) => state.team.id;

export const selectIsTeamRegistered = (state: RootState): boolean =>
  !!state.team.id &&
  !!state.team.abbreviation &&
  !!state.team.logoUrl &&
  !!state.team.name;

export const { setTeam, clearTeam, setAugmentId } = teamSlice.actions;

export default teamSlice.reducer;
