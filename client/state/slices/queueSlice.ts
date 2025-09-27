import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

type QueueState = {
  isInQueue: boolean;
};

const initialState: QueueState = {
  isInQueue: false,
};

const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    setQueueStatus: (state, action: PayloadAction<{ isInQueue: boolean }>) => {
      const { isInQueue } = action.payload;
      state.isInQueue = isInQueue;
    },
    clearQueueStatus: (state) => {
      state.isInQueue = false;
    },
  },
});

export const selectIsInQueue = (state: RootState) => state.queue.isInQueue;

export const { setQueueStatus, clearQueueStatus } = queueSlice.actions;

export default queueSlice.reducer;
