import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import { DEFAULT_SEASON, type SeasonConfigDoc } from "../../data/season.js";

export const stageSeasonConfig = (
  db: Firestore,
  batch: WriteBatch,
  config: SeasonConfigDoc = DEFAULT_SEASON,
): void => {
  batch.set(db.collection("config").doc("season"), {
    ...config,
    updatedAt: new Date(),
  });
};
