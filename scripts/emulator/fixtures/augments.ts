import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import type { Augment } from "../../../client/types/augment.js";

export type AugmentDefinition = Omit<Augment, "createdAt" | "updatedAt">;

export type AugmentFixture = AugmentDefinition & {
  createdAt?: Date;
  updatedAt?: Date;
};

export const stageAugments = (
  db: Firestore,
  batch: WriteBatch,
  augments: readonly AugmentFixture[],
  now = new Date(),
): void => {
  for (const augment of augments) {
    batch.set(db.collection("augments").doc(augment.id), {
      ...augment,
      createdAt: augment.createdAt ?? now,
      updatedAt: augment.updatedAt ?? now,
    });
  }
};

export const seedAugments = async (
  db: Firestore,
  augments: readonly AugmentFixture[],
): Promise<readonly AugmentFixture[]> => {
  const batch = db.batch();
  stageAugments(db, batch, augments);
  await batch.commit();
  return augments;
};
