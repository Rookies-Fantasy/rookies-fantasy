import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Player = {
  id: string;
  firstName: string;
  secondName: string;
  [key: string]: any;
};

type LineupState = {
  players: Player[];
};

const initialState: LineupState = {
  players: [],
};

const lineupSlice = createSlice({
  name: "lineup",
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<Player>) => {
      const exists = state.players.find((p) => p.id === action.payload.id);
      if (!exists) {
        state.players.push(action.payload);
      }
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter((p) => p.id !== action.payload);
    },
  },
});

export const { addPlayer, removePlayer } = lineupSlice.actions;
export default lineupSlice.reducer;
