import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import { DEFAULT_SEASON } from "../../data/season.js";

export const stageSeasonConfig = (db: Firestore, batch: WriteBatch): void => {
  batch.set(db.collection("config").doc("season"), {
    ...DEFAULT_SEASON,
    updatedAt: new Date(),
  });
};
