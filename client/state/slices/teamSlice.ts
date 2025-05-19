import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { defaultTeam, Team } from "@/types/teamTypes";

const teamSlice = createSlice({
  name: "team",
  initialState: defaultTeam,
  reducers: {
    setTeam: (_, action: PayloadAction<Team>) => action.payload,
    clearTeam: () => defaultTeam,
  },
});

export const selectTeamId = (state: RootState) => state.team.id;

export const selectIsTeamRegistered = (state: RootState): boolean =>
  state.team.id !== undefined &&
  state.team.abbreviation !== undefined &&
  state.team.logoUrl !== undefined &&
  state.team.name !== undefined;

export const { setTeam, clearTeam } = teamSlice.actions;

export default teamSlice.reducer;
