import { admin } from "./admin";

export const commitIfNeeded = async (
  batch: FirebaseFirestore.WriteBatch,
  count: number,
  limit: number,
) => {
  if (count >= limit) {
    await batch.commit();
    console.log("Committed batch");
    return {
      batch: admin.firestore().batch(),
      count: 0,
    };
  }

  return { batch, count: count + 1 };
};

export type BatchState = {
  batch: FirebaseFirestore.WriteBatch;
  opCount: number;
};
