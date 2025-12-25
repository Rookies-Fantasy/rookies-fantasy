import { db } from "./firebaseConfig.js";

const PLAYERS_COLLECTION = "nbaPlayers";
const BATCH_SIZE = 500;

const addLowercaseNameFields = async() => {
  let lastDoc = null;
  let updatedCount = 0;

  while (true) {
    let query = db
      .collection(PLAYERS_COLLECTION)
      .orderBy("lastName")
      .limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      console.log("All documents processed");
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const firstName = data.firstName ?? "";
      const lastName = data.lastName ?? "";
      const firstNameLower = firstName.toLowerCase();
      const lastNameLower = lastName.toLowerCase();
      const fullNameLower = `${firstNameLower} ${lastNameLower}`.trim();

      batch.update(doc.ref, {
        firstNameLower,
        lastNameLower,
        fullNameLower,
      });

      updatedCount++;
    });

    await batch.commit();
    console.log(`Updated ${updatedCount} documents so far...`);

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log(`Done! Total documents updated: ${updatedCount}`);
}

addLowercaseNameFields();
