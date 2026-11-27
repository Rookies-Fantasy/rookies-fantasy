import "dotenv/config";
import { db } from "./firebaseConfig.js";
import { augmentsData } from "./data/augmentsData.js";

const updateAugments = async () => {
  try {
    const augmentsCollection = db.collection("augments");

    const existingAugments = await augmentsCollection.get();

    const existingAugmentsMap = new Map();
    existingAugments.docs.forEach((doc) => {
      const data = doc.data();
      existingAugmentsMap.set(data.title, { id: doc.id, ref: doc.ref, data });
    });

    const batch = db.batch();
    let updateCount = 0;

    for (const augment of augmentsData) {
      const existingDoc = existingAugmentsMap.get(augment.title);

      if (existingDoc) {
        const updateData = {
          ...augment,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.update(existingDoc.ref, updateData);
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log(
        `Successfully updated ${updateCount} augments using batch write!`
      );
    } else {
      console.log("No augments to update.");
    }
  } catch (error) {
    console.error("Error updating augments:", error);
  }
};

// Run the function
updateAugments();
