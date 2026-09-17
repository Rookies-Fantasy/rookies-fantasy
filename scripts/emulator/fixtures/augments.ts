import type { Firestore } from "firebase-admin/firestore";
import type { Augment } from "../../../client/types/augment.js";

export type AugmentDefinition = Omit<Augment, "createdAt" | "updatedAt">;

export type AugmentFixture = AugmentDefinition & {
  createdAt?: Date;
  updatedAt?: Date;
};

export const seedAugments = async (
  db: Firestore,
  augments: readonly AugmentFixture[],
): Promise<readonly AugmentFixture[]> => {
  const batch = db.batch();
  const now = new Date();

  for (const augment of augments) {
    batch.set(db.collection("augments").doc(augment.id), {
      ...augment,
      createdAt: augment.createdAt ?? now,
      updatedAt: augment.updatedAt ?? now,
    });
  }

  await batch.commit();
  return augments;
};
