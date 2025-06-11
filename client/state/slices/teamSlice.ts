import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { defaultTeam, Team } from "@/types/teamTypes";
import { isNotNil } from "@/utils/jsUtils";

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
  isNotNil(state.team.id);

export const { setTeam, clearTeam } = teamSlice.actions;

export default teamSlice.reducer;
