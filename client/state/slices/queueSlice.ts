import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Queue } from "@/types/queue";

type QueueState = {
  queueStatus: Queue | null;
  isInQueue: boolean;
};

const initialState: QueueState = {
  queueStatus: null,
  isInQueue: false,
};

const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    setQueueStatus: (
      state,
      action: PayloadAction<{ queueStatus: Queue | null; isInQueue: boolean }>,
    ) => {
      const { queueStatus, isInQueue } = action.payload;
      state.queueStatus = queueStatus;
      state.isInQueue = isInQueue;
    },
    clearQueueStatus: (state) => {
      state.queueStatus = null;
      state.isInQueue = false;
    },
  },
});

export const selectQueueStatus = (state: RootState) => state.queue.queueStatus;
export const selectIsInQueue = (state: RootState) => state.queue.isInQueue;

export const { setQueueStatus, clearQueueStatus } = queueSlice.actions;

export default queueSlice.reducer;
